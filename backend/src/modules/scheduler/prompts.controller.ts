import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  Journal,
  Participant,
  Prompt,
  PromptSend,
  ScheduledPrompt,
  User,
} from '../../database/entities';

/**
 * Endpoints that power the in-app prompts experience:
 *   - GET    /prompts/feed                  — pending in-app prompts for the user
 *   - POST   /prompts/sends/:id/responded   — mark an in-app prompt answered
 *   - GET    /prompts/upcoming/:journalId   — list scheduled/future prompts (owner)
 *   - POST   /prompts/upcoming/:journalId   — owner adds a custom prompt to schedule
 *   - PATCH  /prompts/upcoming/:scheduledId — owner edits a queued prompt's text
 *   - DELETE /prompts/upcoming/:scheduledId — owner cancels a queued prompt
 *
 * Owner-only actions guard on Journal.owner_id === current user's id.
 * Feed actions resolve the current user to Participant rows by phone or email.
 */
@Controller('prompts')
@UseGuards(ClerkAuthGuard)
export class PromptsController {
  constructor(
    @InjectRepository(PromptSend)
    private readonly promptSendRepo: Repository<PromptSend>,
    @InjectRepository(ScheduledPrompt)
    private readonly scheduledPromptRepo: Repository<ScheduledPrompt>,
    @InjectRepository(Prompt)
    private readonly promptRepo: Repository<Prompt>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
    @InjectRepository(Journal)
    private readonly journalRepo: Repository<Journal>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ---- Helpers ---------------------------------------------------------

  private async requireUser(auth: AuthUser): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { clerk_id: auth.clerkId },
    });
    if (!user) throw new NotFoundException('User not found; sync user first');
    return user;
  }

  /** All Participant rows that map to this User (by phone or email). */
  private async participantsForUser(user: User): Promise<Participant[]> {
    const where: any[] = [];
    if (user.phone_number) where.push({ phone_number: user.phone_number });
    if (user.email) where.push({ email: user.email });
    if (!where.length) return [];
    return this.participantRepo.find({ where });
  }

  private async requireOwnedJournal(user: User, journalId: string): Promise<Journal> {
    const journal = await this.journalRepo.findOne({ where: { id: journalId } });
    if (!journal) throw new NotFoundException('Journal not found');
    if (journal.owner_id !== user.id) {
      throw new NotFoundException('Journal not found'); // don't leak existence
    }
    return journal;
  }

  // ---- Feed: in-app prompts the user hasn't answered yet ----------------

  /**
   * Returns un-responded in-app PromptSend rows for the signed-in user,
   * across all their journals. Joins prompt text + journal title so the
   * mobile app can render the feed in one round-trip.
   */
  @Get('feed')
  async feed(@CurrentUser() auth: AuthUser, @Query('limit') limit?: string) {
    const user = await this.requireUser(auth);
    const participants = await this.participantsForUser(user);
    if (!participants.length) return { items: [] };

    const take = Math.min(Number(limit) || 50, 200);

    const sends = await this.promptSendRepo
      .createQueryBuilder('ps')
      .leftJoinAndSelect('ps.scheduled_prompt', 'sp')
      .leftJoinAndSelect('sp.prompt', 'p')
      .leftJoinAndSelect('sp.journal', 'j')
      .where('ps.participant_id IN (:...ids)', {
        ids: participants.map((p) => p.id),
      })
      .andWhere('ps.channel = :channel', { channel: 'in_app' })
      .andWhere('ps.responded_at IS NULL')
      .orderBy('ps.created_at', 'DESC')
      .take(take)
      .getMany();

    return {
      items: sends.map((s) => ({
        promptSendId: s.id,
        scheduledPromptId: s.scheduled_prompt_id,
        participantId: s.participant_id,
        journalId: s.scheduled_prompt?.journal_id,
        journalTitle: s.scheduled_prompt?.journal?.title ?? null,
        promptText: s.scheduled_prompt?.prompt?.text ?? null,
        promptCategory: s.scheduled_prompt?.prompt?.category ?? null,
        sentAt: s.sent_at,
        createdAt: s.created_at,
      })),
    };
  }

  /**
   * Mark an in-app prompt as responded. Used both when the user taps
   * "Respond" → composes an entry (the entries flow will call this after
   * a successful create), and as a manual "dismiss" button on the feed.
   */
  @Post('sends/:id/responded')
  async markResponded(
    @CurrentUser() auth: AuthUser,
    @Param('id') sendId: string,
  ) {
    const user = await this.requireUser(auth);
    const participants = await this.participantsForUser(user);
    if (!participants.length) throw new NotFoundException('Prompt send not found');

    const send = await this.promptSendRepo.findOne({
      where: {
        id: sendId,
        participant_id: In(participants.map((p) => p.id)),
      },
    });
    if (!send) throw new NotFoundException('Prompt send not found');

    if (!send.responded_at) {
      send.responded_at = new Date();
      await this.promptSendRepo.save(send);
    }
    return { id: send.id, responded_at: send.responded_at };
  }

  // ---- Owner-facing: manage the journal's upcoming prompts --------------

  /**
   * Lists scheduled prompts for a journal that haven't been sent yet
   * (or are in flight). Also includes the most recently sent ones so the
   * owner can see context. Owner-only.
   */
  @Get('upcoming/:journalId')
  async upcoming(
    @CurrentUser() auth: AuthUser,
    @Param('journalId') journalId: string,
  ) {
    const user = await this.requireUser(auth);
    await this.requireOwnedJournal(user, journalId);

    const rows = await this.scheduledPromptRepo
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.prompt', 'p')
      .where('sp.journal_id = :journalId', { journalId })
      .orderBy('sp.scheduled_for', 'ASC')
      .getMany();

    return {
      items: rows.map((sp) => ({
        scheduledPromptId: sp.id,
        promptId: sp.prompt_id,
        text: sp.prompt?.text ?? null,
        category: sp.prompt?.category ?? null,
        scheduledFor: sp.scheduled_for,
        status: sp.status,
        sentAt: sp.sent_at,
        isCustom: sp.prompt?.is_custom ?? false,
      })),
    };
  }

  /**
   * Owner adds a custom prompt to the schedule. We create a Prompt row
   * scoped to this journal (`is_custom: true`) and a ScheduledPrompt that
   * points to it. The cron picks it up at `scheduledFor`.
   */
  @Post('upcoming/:journalId')
  async addCustom(
    @CurrentUser() auth: AuthUser,
    @Param('journalId') journalId: string,
    @Body() body: { text: string; scheduledFor: string; category?: string },
  ) {
    const user = await this.requireUser(auth);
    await this.requireOwnedJournal(user, journalId);

    const text = (body.text ?? '').trim();
    if (!text) throw new BadRequestException('text is required');
    const when = new Date(body.scheduledFor);
    if (Number.isNaN(when.getTime())) {
      throw new BadRequestException('scheduledFor is not a valid date');
    }

    const prompt = await this.promptRepo.save({
      journal_id: journalId,
      text,
      category: body.category ?? 'custom',
      is_custom: true,
    });

    const sp = await this.scheduledPromptRepo.save({
      journal_id: journalId,
      prompt_id: prompt.id,
      scheduled_for: when,
      status: 'pending',
    });

    return {
      scheduledPromptId: sp.id,
      promptId: prompt.id,
      text: prompt.text,
      scheduledFor: sp.scheduled_for,
      status: sp.status,
    };
  }

  /**
   * Owner edits a queued prompt. Only the text can change — moving the
   * send time would require a separate (and rarer) endpoint.
   * Refuses to edit prompts that have already been sent.
   */
  @Patch('upcoming/:scheduledId')
  async editUpcoming(
    @CurrentUser() auth: AuthUser,
    @Param('scheduledId') scheduledId: string,
    @Body() body: { text?: string; scheduledFor?: string },
  ) {
    const user = await this.requireUser(auth);

    const sp = await this.scheduledPromptRepo.findOne({
      where: { id: scheduledId },
      relations: ['prompt'],
    });
    if (!sp) throw new NotFoundException('Scheduled prompt not found');
    await this.requireOwnedJournal(user, sp.journal_id);

    if (sp.status !== 'pending') {
      throw new BadRequestException(
        `Cannot edit a prompt that is ${sp.status}`,
      );
    }

    if (typeof body.text === 'string') {
      const text = body.text.trim();
      if (!text) throw new BadRequestException('text cannot be empty');
      // Mutate the underlying Prompt only if it's a journal-scoped custom
      // prompt. Editing a template prompt's text would affect other journals,
      // so for those we fork into a new is_custom prompt instead.
      if (sp.prompt?.is_custom && sp.prompt?.journal_id === sp.journal_id) {
        sp.prompt.text = text;
        await this.promptRepo.save(sp.prompt);
      } else {
        const forked = await this.promptRepo.save({
          journal_id: sp.journal_id,
          text,
          category: sp.prompt?.category ?? 'custom',
          is_custom: true,
        });
        sp.prompt_id = forked.id;
        sp.prompt = forked;
      }
    }

    if (typeof body.scheduledFor === 'string') {
      const when = new Date(body.scheduledFor);
      if (Number.isNaN(when.getTime())) {
        throw new BadRequestException('scheduledFor is not a valid date');
      }
      sp.scheduled_for = when;
    }

    await this.scheduledPromptRepo.save(sp);

    return {
      scheduledPromptId: sp.id,
      promptId: sp.prompt_id,
      text: sp.prompt?.text ?? null,
      scheduledFor: sp.scheduled_for,
      status: sp.status,
    };
  }

  /**
   * Owner cancels a queued prompt. We don't hard-delete — we set status
   * to 'cancelled' so any later report queries still see the row.
   */
  @Delete('upcoming/:scheduledId')
  async cancelUpcoming(
    @CurrentUser() auth: AuthUser,
    @Param('scheduledId') scheduledId: string,
  ) {
    const user = await this.requireUser(auth);

    const sp = await this.scheduledPromptRepo.findOne({
      where: { id: scheduledId },
    });
    if (!sp) throw new NotFoundException('Scheduled prompt not found');
    await this.requireOwnedJournal(user, sp.journal_id);

    if (sp.status !== 'pending') {
      throw new BadRequestException(
        `Cannot cancel a prompt that is ${sp.status}`,
      );
    }

    sp.status = 'cancelled';
    await this.scheduledPromptRepo.save(sp);
    return { id: sp.id, status: sp.status };
  }
}
