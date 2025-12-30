import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant, Journal, User } from '../../database/entities';
import { CreateParticipantDto } from './dto/create-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
    @InjectRepository(Journal)
    private journalRepo: Repository<Journal>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
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
      status: 'active', // For testing, auto-activate
      opted_in: true,
    });

    return this.participantRepo.save(participant);
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

    await this.participantRepo.update(id, { status: 'removed' });
  }
}
