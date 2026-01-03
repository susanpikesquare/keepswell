import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Participant, Journal, User } from '../../database/entities';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { SmsService } from '../sms/sms.service';
import { SmsLimitsService } from '../sms/sms-limits.service';
import { SubscriptionService } from '../payments/subscription.service';

@Injectable()
export class ParticipantsService {
  private readonly logger = new Logger(ParticipantsService.name);
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
    @InjectRepository(Journal)
    private journalRepo: Repository<Journal>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private smsService: SmsService,
    private smsLimitsService: SmsLimitsService,
    private subscriptionService: SubscriptionService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://keepswell.com';
  }

  private async getUserByClerkId(clerkId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private generateMagicToken(): string {
    return randomBytes(32).toString('hex');
  }

  async create(
    journalId: string,
    clerkId: string,
    dto: CreateParticipantDto,
  ): Promise<Participant> {
    const user = await this.getUserByClerkId(clerkId);

    // Verify user owns the journal
    const journal = await this.journalRepo.findOne({
      where: { id: journalId, owner_id: user.id },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    // Check contributor limit (3 for free, 15 for pro)
    const canAdd = await this.subscriptionService.canAddContributor(user, journalId);
    if (!canAdd.allowed) {
      throw new ForbiddenException(canAdd.reason);
    }

    // Get tier limits to determine if SMS is allowed
    const tierLimits = this.subscriptionService.getTierLimits(user);

    // Block phone number for free tier users (SMS is Pro only)
    const effectivePhoneNumber = tierLimits.smsEnabled ? dto.phone_number : undefined;

    // Generate magic token for participant access
    const magicToken = this.generateMagicToken();
    const tokenExpiry = new Date();
    tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 1); // Valid for 1 year

    const participant = this.participantRepo.create({
      ...dto,
      phone_number: effectivePhoneNumber, // Use tier-gated phone
      journal_id: journalId,
      status: 'pending', // Start as pending until they confirm
      opted_in: false,
      magic_token: magicToken,
      magic_token_expires_at: tokenExpiry,
    });

    const savedParticipant = await this.participantRepo.save(participant);

    // Send SMS invite only if phone number is allowed (Pro tier) and provided
    if (effectivePhoneNumber) {
      // Check SMS tier gating (will pass for Pro users)
      const limitCheck = await this.smsLimitsService.canSendInvite(user.id);
      if (!limitCheck.allowed) {
        this.logger.warn(`SMS invite blocked for user ${user.id}: ${limitCheck.reason}`);
        return savedParticipant;
      }

      const ownerName = user.full_name || user.email || 'Someone';
      const viewUrl = `${this.frontendUrl}/p/${magicToken}`;
      const result = await this.smsService.sendInvite(
        effectivePhoneNumber,
        dto.display_name,
        journal.title,
        ownerName,
        viewUrl,
      );

      if (result.success) {
        await this.smsLimitsService.recordInviteSent(user.id);
        this.logger.log(`Invite SMS sent to ${dto.display_name} at ${effectivePhoneNumber}`);
      } else {
        this.logger.warn(`Failed to send invite SMS to ${effectivePhoneNumber}: ${result.error}`);
      }
    }

    return savedParticipant;
  }

  async findByJournal(journalId: string, clerkId: string): Promise<Participant[]> {
    const user = await this.getUserByClerkId(clerkId);

    // Verify user owns the journal
    const journal = await this.journalRepo.findOne({
      where: { id: journalId, owner_id: user.id },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    return this.participantRepo.find({
      where: { journal_id: journalId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Participant> {
    const participant = await this.participantRepo.findOne({
      where: { id },
      relations: ['journal'],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    return participant;
  }

  async findByPhone(phone: string, journalId: string): Promise<Participant | null> {
    return this.participantRepo.findOne({
      where: { phone_number: phone, journal_id: journalId },
    });
  }

  async update(
    id: string,
    clerkId: string,
    data: Partial<{ display_name: string; status: string; relationship: string }>,
  ): Promise<Participant> {
    const user = await this.getUserByClerkId(clerkId);

    const participant = await this.participantRepo.findOne({
      where: { id },
      relations: ['journal'],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to update this participant');
    }

    await this.participantRepo.update(id, data);
    return this.participantRepo.findOneOrFail({ where: { id } });
  }

  async remove(id: string, clerkId: string): Promise<void> {
    const user = await this.getUserByClerkId(clerkId);

    const participant = await this.participantRepo.findOne({
      where: { id },
      relations: ['journal'],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to remove this participant');
    }

    await this.participantRepo.delete(id);
  }

  async resendInvite(id: string, clerkId: string): Promise<{ success: boolean; error?: string; limitReached?: boolean }> {
    const user = await this.getUserByClerkId(clerkId);

    const participant = await this.participantRepo.findOne({
      where: { id },
      relations: ['journal'],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to resend invite for this participant');
    }

    if (!participant.phone_number) {
      return { success: false, error: 'Participant has no phone number' };
    }

    // Check SMS invite limits for free tier users
    const limitCheck = await this.smsLimitsService.canSendInvite(user.id);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.reason, limitReached: true };
    }

    // Regenerate magic token if expired or missing
    let magicToken = participant.magic_token;
    if (!magicToken || (participant.magic_token_expires_at && participant.magic_token_expires_at < new Date())) {
      magicToken = this.generateMagicToken();
      const tokenExpiry = new Date();
      tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 1);
      await this.participantRepo.update(id, {
        magic_token: magicToken,
        magic_token_expires_at: tokenExpiry,
      });
    }

    const ownerName = user.full_name || user.email || 'Someone';
    const viewUrl = `${this.frontendUrl}/p/${magicToken}`;
    const result = await this.smsService.sendInvite(
      participant.phone_number,
      participant.display_name,
      participant.journal.title,
      ownerName,
      viewUrl,
    );

    if (result.success) {
      // Record the invite was sent
      await this.smsLimitsService.recordInviteSent(user.id);
      this.logger.log(`Invite re-sent to ${participant.display_name} at ${participant.phone_number}`);
    }

    return result;
  }

  async findByMagicToken(token: string): Promise<Participant | null> {
    const participant = await this.participantRepo.findOne({
      where: { magic_token: token },
      relations: ['journal', 'journal.owner'],
    });

    if (!participant) {
      return null;
    }

    // Check if token is expired
    if (participant.magic_token_expires_at && participant.magic_token_expires_at < new Date()) {
      return null;
    }

    return participant;
  }

  /**
   * Approve a pending participant (from keyword join request)
   * Sets them to active and sends welcome SMS
   */
  async approve(id: string, clerkId: string): Promise<Participant> {
    const user = await this.getUserByClerkId(clerkId);

    const participant = await this.participantRepo.findOne({
      where: { id },
      relations: ['journal'],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to approve this participant');
    }

    if (participant.status !== 'pending') {
      throw new ForbiddenException('Participant is not pending approval');
    }

    // Update to active status
    await this.participantRepo.update(id, {
      status: 'active',
      opted_in: true,
      opted_in_at: new Date(),
    });

    this.logger.log(`Participant ${participant.display_name} approved for journal "${participant.journal.title}"`);

    // Send opt-in confirmation SMS to the approved participant (10DLC compliant - keyword opt-in format)
    if (participant.phone_number) {
      await this.smsService.sendSms(
        participant.phone_number,
        `Keepswell (PikeSquare, LLC): Welcome to "${participant.journal.title}"! You've opted in to receive memory journal prompts. Msg freq varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. We will not share your mobile info with third parties for marketing.`,
      );
    }

    return this.participantRepo.findOneOrFail({ where: { id } });
  }

  /**
   * Decline a pending participant (from keyword join request)
   * Removes the pending participant and optionally notifies them
   */
  async decline(id: string, clerkId: string): Promise<void> {
    const user = await this.getUserByClerkId(clerkId);

    const participant = await this.participantRepo.findOne({
      where: { id },
      relations: ['journal'],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to decline this participant');
    }

    if (participant.status !== 'pending') {
      throw new ForbiddenException('Participant is not pending approval');
    }

    // Notify the declined participant
    if (participant.phone_number) {
      await this.smsService.sendSms(
        participant.phone_number,
        `Keepswell: Your request to join "${participant.journal.title}" was not approved. If you believe this is an error, please contact the journal owner.`,
      );
    }

    // Remove the pending participant
    await this.participantRepo.delete(id);

    this.logger.log(`Participant request from ${participant.phone_number} declined for journal "${participant.journal.title}"`);
  }
}
