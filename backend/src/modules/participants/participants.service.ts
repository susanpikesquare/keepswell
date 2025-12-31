import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant, Journal, User } from '../../database/entities';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class ParticipantsService {
  private readonly logger = new Logger(ParticipantsService.name);

  constructor(
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
    @InjectRepository(Journal)
    private journalRepo: Repository<Journal>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private smsService: SmsService,
  ) {}

  private async getUserByClerkId(clerkId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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

    const participant = this.participantRepo.create({
      ...dto,
      journal_id: journalId,
      status: 'pending', // Start as pending until they confirm
      opted_in: false,
    });

    const savedParticipant = await this.participantRepo.save(participant);

    // Send SMS invite if phone number is provided
    if (dto.phone_number) {
      const ownerName = user.full_name || user.email || 'Someone';
      const result = await this.smsService.sendInvite(
        dto.phone_number,
        dto.display_name,
        journal.title,
        ownerName,
      );

      if (result.success) {
        this.logger.log(`Invite SMS sent to ${dto.display_name} at ${dto.phone_number}`);
      } else {
        this.logger.warn(`Failed to send invite SMS to ${dto.phone_number}: ${result.error}`);
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

  async resendInvite(id: string, clerkId: string): Promise<{ success: boolean; error?: string }> {
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

    const ownerName = user.full_name || user.email || 'Someone';
    const result = await this.smsService.sendInvite(
      participant.phone_number,
      participant.display_name,
      participant.journal.title,
      ownerName,
    );

    if (result.success) {
      this.logger.log(`Invite re-sent to ${participant.display_name} at ${participant.phone_number}`);
    }

    return result;
  }
}
