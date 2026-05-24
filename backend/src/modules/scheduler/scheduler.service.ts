import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Journal,
  Participant,
  ScheduledPrompt,
  PromptSend,
  Prompt,
  User,
} from '../../database/entities';
import { SmsService } from '../sms/sms.service';
import { PromptSelectionService } from '../templates/prompt-selection.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly frontendUrl: string;

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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private smsService: SmsService,
    private promptSelectionService: PromptSelectionService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://keepswell.com';
  }

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

      // A participant is eligible if they can receive the prompt on ANY
      // configured channel:
      //   - sms      → needs a real phone (owner-placeholders filtered out)
      //   - in_app   → needs a linked User account with a registered push token
      //   - both     → either works; we'll fan out per channel below
      // We keep the broader filter here so in-app-only participants stop
      // getting silently skipped just because they have no phone number.
      const eligibleParticipants = participants.filter((p) => {
        const channel = p.delivery_channel ?? 'sms';
        const hasRealPhone =
          !!p.phone_number && !p.phone_number.startsWith('owner-');
        if (channel === 'sms') return hasRealPhone;
        // 'in_app' and 'both' are routed via push; the push step itself will
        // no-op if there's no linked user / no active token, which is fine.
        return true;
      });

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

      // Construct memory book URL if journal has share_token
      const viewUrl = journal.share_token
        ? `${this.frontendUrl}/shared/${journal.share_token}`
        : undefined;

      // Send to each participant
      let successCount = 0;
      let failCount = 0;

      for (const participant of eligibleParticipants) {
        const result = await this.sendPromptToParticipant(
          scheduledPrompt,
          participant,
          prompt,
          journal.title,
          viewUrl,
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
   * Send a prompt to a single participant. Honors `participant.delivery_channel`:
   *   - 'sms'    → one PromptSend row, channel='sms', dispatched via Twilio
   *   - 'in_app' → one PromptSend row, channel='in_app', push to linked User
   *   - 'both'   → up to two PromptSend rows (one per channel that worked)
   *
   * The "success" returned here is the OR across channels — if either
   * channel reached the participant we consider the dispatch successful so
   * the caller's success/fail counters reflect actual reach.
   */
  private async sendPromptToParticipant(
    scheduledPrompt: ScheduledPrompt,
    participant: Participant,
    prompt: Prompt,
    journalTitle: string,
    viewUrl?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const channel = participant.delivery_channel ?? 'sms';
    const wantsSms = channel === 'sms' || channel === 'both';
    const wantsInApp = channel === 'in_app' || channel === 'both';

    const errors: string[] = [];
    let anySuccess = false;
    let firstMessageId: string | undefined;

    // SMS path (skip if the participant has no real phone — relevant for
    // 'both' on someone we haven't collected a phone for).
    const hasRealPhone =
      !!participant.phone_number && !participant.phone_number.startsWith('owner-');
    if (wantsSms && hasRealPhone) {
      const smsResult = await this.dispatchSms(
        scheduledPrompt,
        participant,
        prompt,
        journalTitle,
        viewUrl,
      );
      if (smsResult.success) {
        anySuccess = true;
        if (!firstMessageId && smsResult.messageId) firstMessageId = smsResult.messageId;
      } else if (smsResult.error) {
        errors.push(`sms: ${smsResult.error}`);
      }
    }

    // In-app path: requires a linked User (matched by phone or email). The
    // PromptSend row is still created so the in-app feed query can find it;
    // we mark it 'sent' (delivered) immediately since "delivery" for in-app
    // means "available in the feed", not "push receipt confirmed".
    if (wantsInApp) {
      const inAppResult = await this.dispatchInApp(
        scheduledPrompt,
        participant,
        prompt,
        journalTitle,
      );
      if (inAppResult.success) {
        anySuccess = true;
      } else if (inAppResult.error) {
        errors.push(`in_app: ${inAppResult.error}`);
      }
    }

    if (anySuccess) {
      return { success: true, messageId: firstMessageId };
    }
    return {
      success: false,
      error: errors.length ? errors.join('; ') : 'no channels available',
    };
  }

  /** SMS dispatch path — preserves the original Twilio behavior + PromptSend row. */
  private async dispatchSms(
    scheduledPrompt: ScheduledPrompt,
    participant: Participant,
    prompt: Prompt,
    journalTitle: string,
    viewUrl?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const promptSend = await this.promptSendRepository.save({
      scheduled_prompt_id: scheduledPrompt.id,
      participant_id: participant.id,
      status: 'pending',
      channel: 'sms',
    });

    try {
      const result = await this.smsService.sendPrompt(
        participant.phone_number,
        prompt.text,
        journalTitle,
        viewUrl,
      );

      promptSend.status = result.success ? 'sent' : 'failed';
      if (result.success) promptSend.sent_at = new Date();
      if (result.messageId) promptSend.twilio_message_sid = result.messageId;
      if (result.error) promptSend.error_message = result.error;
      await this.promptSendRepository.save(promptSend);

      return result;
    } catch (error) {
      promptSend.status = 'failed';
      promptSend.error_message = (error as Error).message;
      await this.promptSendRepository.save(promptSend);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * In-app dispatch path: writes a PromptSend(channel='in_app') row that the
   * mobile app's prompt feed will read, and fires a best-effort push if a
   * linked User exists (matched by phone_number or email).
   */
  private async dispatchInApp(
    scheduledPrompt: ScheduledPrompt,
    participant: Participant,
    prompt: Prompt,
    journalTitle: string,
  ): Promise<{ success: boolean; error?: string }> {
    const promptSend = await this.promptSendRepository.save({
      scheduled_prompt_id: scheduledPrompt.id,
      participant_id: participant.id,
      status: 'sent',
      channel: 'in_app',
      sent_at: new Date(),
    });

    // Best-effort: find the linked user (if any) and send a push. We never
    // fail the in-app dispatch on push errors — the prompt is already in the
    // feed; push is just a courtesy nudge.
    try {
      const user = await this.findLinkedUserForParticipant(participant);
      if (user) {
        await this.notificationsService.sendToUser(user.id, {
          title: `New prompt for ${journalTitle}`,
          body: prompt.text,
          data: {
            kind: 'prompt',
            journalId: scheduledPrompt.journal_id,
            promptSendId: promptSend.id,
            scheduledPromptId: scheduledPrompt.id,
          },
        });
      } else {
        this.logger.debug(
          `dispatchInApp: no linked user for participant ${participant.id}; ` +
            `prompt is in feed, no push sent`,
        );
      }
      return { success: true };
    } catch (error) {
      this.logger.warn(
        `dispatchInApp push failed for participant ${participant.id}: ${(error as Error).message}`,
      );
      // Still a "success" for the caller: the row is written, the feed will show it.
      return { success: true };
    }
  }

  /**
   * Resolve a Participant to a User row using phone first, then email.
   * Returns null when no match — caller must handle gracefully.
   */
  private async findLinkedUserForParticipant(
    participant: Participant,
  ): Promise<User | null> {
    if (participant.phone_number && !participant.phone_number.startsWith('owner-')) {
      const byPhone = await this.userRepository.findOne({
        where: { phone_number: participant.phone_number },
      });
      if (byPhone) return byPhone;
    }
    if (participant.email) {
      const byEmail = await this.userRepository.findOne({
        where: { email: participant.email },
      });
      if (byEmail) return byEmail;
    }
    return null;
  }

  /**
   * Pre-create the next N ScheduledPrompt rows for a journal so the owner can
   * preview and edit them in the "Upcoming prompts" UI before the cron actually
   * fires them. Each row gets its `scheduled_for` computed from the journal's
   * frequency/day/time, and its `prompt_id` chosen via PromptSelectionService
   * with previously-seeded prompts excluded so the seed doesn't pick the same
   * prompt twice in a row.
   *
   * Idempotent in the sense that it won't blow away existing pending rows;
   * if there are already `count` pending rows it returns without doing work.
   *
   * Returns the created scheduled prompts (may be fewer than `count` if the
   * template doesn't have enough distinct prompts).
   */
  async seedUpcomingScheduledPrompts(
    journalId: string,
    count = 8,
  ): Promise<ScheduledPrompt[]> {
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });
    if (!journal) {
      this.logger.warn(`seedUpcomingScheduledPrompts: journal ${journalId} not found`);
      return [];
    }

    const existingPending = await this.scheduledPromptRepository.count({
      where: { journal_id: journalId, status: 'pending' },
    });
    if (existingPending >= count) {
      this.logger.debug(
        `seedUpcomingScheduledPrompts: ${journalId} already has ${existingPending} pending; skipping`,
      );
      return [];
    }

    const toCreate = count - existingPending;
    const created: ScheduledPrompt[] = [];
    const excludePromptIds: string[] = [];

    // Start from "next valid send" so we don't backfill into the past.
    let cursor = this.nextSendAfter(new Date(), journal);

    for (let i = 0; i < toCreate; i++) {
      let prompt: Prompt;
      try {
        const result = await this.promptSelectionService.selectNextPrompt({
          journalId,
          currentDate: cursor,
          excludePromptIds,
        });
        prompt = result.prompt;
      } catch (err) {
        // Template might not have enough distinct prompts; stop early.
        this.logger.warn(
          `seedUpcomingScheduledPrompts: ran out of prompts after ${created.length}: ${(err as Error).message}`,
        );
        break;
      }

      const sp = await this.scheduledPromptRepository.save({
        journal_id: journalId,
        prompt_id: prompt.id,
        scheduled_for: cursor,
        status: 'pending',
      });
      created.push(sp);
      excludePromptIds.push(prompt.id);

      // Advance to the next valid send moment after this one.
      cursor = this.nextSendAfter(cursor, journal);
    }

    this.logger.log(
      `seedUpcomingScheduledPrompts: seeded ${created.length} prompts for journal ${journalId}`,
    );
    return created;
  }

  /**
   * Compute the next valid send moment strictly AFTER `after`, given the
   * journal's frequency/day-of-week/time/timezone settings.
   *
   * Implementation note: we don't have a full tz-aware date library in this
   * service today, so we treat the journal's `prompt_time` as the local
   * wall-clock time and step forward one calendar day at a time looking for
   * the next match. For weekly/biweekly/monthly we additionally require the
   * configured day of week. This is good enough for seeding a preview — the
   * actual dispatch is gated by the cron's existing tz-aware check.
   */
  private nextSendAfter(after: Date, journal: Journal): Date {
    const [h, m] = (journal.prompt_time ?? '09:00:00').split(':').map(Number);

    // Start from the day AFTER `after`. (For the very first call we usually
    // want at least 1 calendar day of lead time so participants get the
    // first prompt tomorrow, not today.)
    const candidate = new Date(after);
    candidate.setSeconds(0, 0);
    candidate.setMinutes(m || 0);
    candidate.setHours(h || 9);
    // Move to tomorrow if the time has passed today (or always for the
    // first prompt to give some breathing room).
    if (candidate <= after) {
      candidate.setDate(candidate.getDate() + 1);
    }

    const freq = journal.prompt_frequency || 'weekly';
    const targetDow = journal.prompt_day_of_week;

    // Cap the search to avoid infinite loop on bad config.
    for (let i = 0; i < 366; i++) {
      const dow = candidate.getDay();

      if (freq === 'daily') {
        return candidate;
      }
      if (freq === 'weekly' && (targetDow == null || dow === targetDow)) {
        return candidate;
      }
      if (freq === 'biweekly' && (targetDow == null || dow === targetDow)) {
        // Biweekly: also requires even-week alignment from `created_at`.
        const weeksSinceCreated = Math.floor(
          (candidate.getTime() - journal.created_at.getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        );
        if (weeksSinceCreated % 2 === 0) return candidate;
      }
      if (
        freq === 'monthly' &&
        (targetDow == null || dow === targetDow) &&
        candidate.getDate() <= 7
      ) {
        return candidate;
      }

      candidate.setDate(candidate.getDate() + 1);
    }

    // Fallback: just return one week out.
    const fallback = new Date(after);
    fallback.setDate(fallback.getDate() + 7);
    return fallback;
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
