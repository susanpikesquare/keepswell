import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Journal,
  Participant,
  ScheduledPrompt,
  PromptSend,
  Prompt,
} from '../../database/entities';
import { SmsService } from '../sms/sms.service';
import { PromptSelectionService } from '../templates/prompt-selection.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(ScheduledPrompt)
    private scheduledPromptRepository: Repository<ScheduledPrompt>,
    @InjectRepository(PromptSend)
    private promptSendRepository: Repository<PromptSend>,
    @InjectRepository(Prompt)
    private promptRepository: Repository<Prompt>,
    private smsService: SmsService,
    private promptSelectionService: PromptSelectionService,
  ) {}

  /**
   * Check for due prompts every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePromptScheduling() {
    this.logger.log('Running prompt scheduler check...');

    try {
      // Find journals that are due for prompts
      const dueJournals = await this.findJournalsDueForPrompts();
      this.logger.log(`Found ${dueJournals.length} journals due for prompts`);

      for (const journal of dueJournals) {
        await this.sendPromptsForJournal(journal);
      }
    } catch (error) {
      this.logger.error(`Error in prompt scheduler: ${error.message}`, error.stack);
    }
  }

  /**
   * Find all active journals that are due for a prompt
   */
  private async findJournalsDueForPrompts(): Promise<Journal[]> {
    const now = new Date();

    // Get all active journals with participants
    const journals = await this.journalRepository
      .createQueryBuilder('journal')
      .leftJoinAndSelect('journal.participants', 'participant')
      .where('journal.status = :status', { status: 'active' })
      .andWhere('participant.status = :participantStatus', { participantStatus: 'active' })
      .andWhere('participant.opted_in = :optedIn', { optedIn: true })
      .getMany();

    const dueJournals: Journal[] = [];

    for (const journal of journals) {
      if (await this.isJournalDueForPrompt(journal, now)) {
        dueJournals.push(journal);
      }
    }

    return dueJournals;
  }

  /**
   * Check if a journal is due for a prompt based on its schedule
   */
  private async isJournalDueForPrompt(journal: Journal, now: Date): Promise<boolean> {
    // Convert current time to journal's timezone
    const journalTime = this.getTimeInTimezone(now, journal.timezone);
    const currentHour = journalTime.getHours();
    const currentMinute = journalTime.getMinutes();
    const currentDayOfWeek = journalTime.getDay();

    // Parse scheduled time (format: "09:00:00")
    const [scheduledHour, scheduledMinute] = journal.prompt_time.split(':').map(Number);

    // Check if we're within 4 minutes after the scheduled time
    // (cron runs every 5 min, so 4 min window ensures only one trigger)
    const scheduledMinuteOfDay = scheduledHour * 60 + scheduledMinute;
    const currentMinuteOfDay = currentHour * 60 + currentMinute;
    const minutesSinceScheduled = currentMinuteOfDay - scheduledMinuteOfDay;

    // Only trigger within 4 minutes after scheduled time
    if (minutesSinceScheduled < 0 || minutesSinceScheduled > 4) {
      return false;
    }

    // Check frequency
    switch (journal.prompt_frequency) {
      case 'daily':
        // Daily prompts are sent every day
        break;
      case 'weekly':
        // Weekly prompts are sent on the configured day
        if (journal.prompt_day_of_week !== currentDayOfWeek) {
          return false;
        }
        break;
      case 'biweekly':
        // Biweekly prompts - check if it's the right week
        if (journal.prompt_day_of_week !== currentDayOfWeek) {
          return false;
        }
        // Check if we're on an even or odd week since journal creation
        const weeksSinceCreation = this.getWeeksSince(journal.created_at, journalTime);
        if (weeksSinceCreation % 2 !== 0) {
          return false;
        }
        break;
      case 'monthly':
        // Monthly prompts are sent on the configured day of week, first occurrence of month
        if (journal.prompt_day_of_week !== currentDayOfWeek) {
          return false;
        }
        // Only send in first week of month (day <= 7)
        if (journalTime.getDate() > 7) {
          return false;
        }
        break;
      default:
        return false;
    }

    // Check if we already sent a prompt today
    const alreadySent = await this.hasPromptBeenSentToday(journal.id, journalTime);
    if (alreadySent) {
      return false;
    }

    return true;
  }

  /**
   * Convert a date to a specific timezone
   */
  private getTimeInTimezone(date: Date, timezone: string): Date {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(date);

      const dateObj: Record<string, string> = {};
      parts.forEach(({ type, value }) => {
        dateObj[type] = value;
      });

      return new Date(
        parseInt(dateObj.year),
        parseInt(dateObj.month) - 1,
        parseInt(dateObj.day),
        parseInt(dateObj.hour),
        parseInt(dateObj.minute),
        parseInt(dateObj.second),
      );
    } catch {
      // Fallback to UTC if timezone is invalid
      return date;
    }
  }

  /**
   * Get number of weeks since a date
   */
  private getWeeksSince(startDate: Date, endDate: Date): number {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor((endDate.getTime() - startDate.getTime()) / msPerWeek);
  }

  /**
   * Check if a prompt has already been sent today for a journal
   * Uses created_at (UTC) to avoid timezone issues
   */
  private async hasPromptBeenSentToday(journalId: string, journalTime: Date): Promise<boolean> {
    // Check for any prompt sent in the last 20 hours to be safe
    // This prevents duplicates regardless of timezone issues
    const twentyHoursAgo = new Date();
    twentyHoursAgo.setHours(twentyHoursAgo.getHours() - 20);

    const existingPrompt = await this.scheduledPromptRepository
      .createQueryBuilder('sp')
      .where('sp.journal_id = :journalId', { journalId })
      .andWhere('sp.created_at >= :twentyHoursAgo', { twentyHoursAgo })
      .getOne();

    return !!existingPrompt;
  }

  /**
   * Send prompts to all active participants of a journal
   */
  private async sendPromptsForJournal(journal: Journal): Promise<void> {
    this.logger.log(`Sending prompts for journal: ${journal.title} (${journal.id})`);

    try {
      // Get active, opted-in participants with real phone numbers
      const participants = await this.participantRepository.find({
        where: {
          journal_id: journal.id,
          status: 'active',
          opted_in: true,
        },
      });

      // Filter out participants without real phone numbers (owner placeholders)
      const eligibleParticipants = participants.filter(
        p => p.phone_number && !p.phone_number.startsWith('owner-')
      );

      if (eligibleParticipants.length === 0) {
        this.logger.log(`No eligible participants for journal ${journal.id}`);
        return;
      }

      // Select a prompt for this journal
      const { prompt } = await this.promptSelectionService.selectNextPrompt({
        journalId: journal.id,
      });

      // Create scheduled prompt record
      const scheduledPrompt = await this.scheduledPromptRepository.save({
        journal_id: journal.id,
        prompt_id: prompt.id,
        scheduled_for: new Date(),
        status: 'pending',
      });

      // Send to each participant
      let successCount = 0;
      let failCount = 0;

      for (const participant of eligibleParticipants) {
        const result = await this.sendPromptToParticipant(
          scheduledPrompt,
          participant,
          prompt,
          journal.title,
        );

        if (result.success) {
          successCount++;
          // Log prompt usage for tracking
          await this.promptSelectionService.logPromptUsage(
            journal.id,
            prompt.id,
            participant.id,
            prompt.category,
          );
        } else {
          failCount++;
        }
      }

      // Update scheduled prompt status
      scheduledPrompt.status = failCount === 0 ? 'sent' : 'sent';
      scheduledPrompt.sent_at = new Date();
      await this.scheduledPromptRepository.save(scheduledPrompt);

      this.logger.log(
        `Sent prompts for journal ${journal.id}: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending prompts for journal ${journal.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Send a prompt to a single participant
   */
  private async sendPromptToParticipant(
    scheduledPrompt: ScheduledPrompt,
    participant: Participant,
    prompt: Prompt,
    journalTitle: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Create prompt send record
    const promptSend = await this.promptSendRepository.save({
      scheduled_prompt_id: scheduledPrompt.id,
      participant_id: participant.id,
      status: 'pending',
    });

    try {
      // Send SMS
      const result = await this.smsService.sendPrompt(
        participant.phone_number,
        prompt.text,
        journalTitle,
      );

      // Update prompt send record
      promptSend.status = result.success ? 'sent' : 'failed';
      if (result.success) {
        promptSend.sent_at = new Date();
      }
      if (result.messageId) {
        promptSend.twilio_message_sid = result.messageId;
      }
      if (result.error) {
        promptSend.error_message = result.error;
      }
      await this.promptSendRepository.save(promptSend);

      return result;
    } catch (error) {
      // Update prompt send record with error
      promptSend.status = 'failed';
      promptSend.error_message = error.message;
      await this.promptSendRepository.save(promptSend);

      return { success: false, error: error.message };
    }
  }

  /**
   * Manually trigger prompt sending for a journal (for testing/admin)
   */
  async triggerPromptForJournal(journalId: string): Promise<{
    success: boolean;
    message: string;
    participantsSent?: number;
  }> {
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      return { success: false, message: 'Journal not found' };
    }

    if (journal.status !== 'active') {
      return { success: false, message: 'Journal is not active' };
    }

    await this.sendPromptsForJournal(journal);

    const participants = await this.participantRepository.count({
      where: {
        journal_id: journalId,
        status: 'active',
        opted_in: true,
      },
    });

    return {
      success: true,
      message: `Prompts sent to ${participants} participant(s)`,
      participantsSent: participants,
    };
  }
}
