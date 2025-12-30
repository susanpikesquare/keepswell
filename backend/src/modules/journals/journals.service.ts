import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Journal, User, Entry } from '../../database/entities';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@Injectable()
export class JournalsService {
  constructor(
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
  ) {}

  async create(clerkId: string, createJournalDto: CreateJournalDto): Promise<Journal> {
    // Find the user by clerk_id
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const journal = this.journalRepository.create({
      ...createJournalDto,
      owner_id: user.id,
    });

    return this.journalRepository.save(journal);
  }

  async findAllByUser(clerkId: string): Promise<Journal[]> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      return [];
    }

    return this.journalRepository.find({
      where: { owner_id: user.id },
      relations: ['participants'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, clerkId: string): Promise<Journal> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const journal = await this.journalRepository.findOne({
      where: { id },
      relations: ['participants', 'entries'],
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    if (journal.owner_id !== user.id) {
      throw new ForbiddenException('You do not have access to this journal');
    }

    return journal;
  }

  async update(id: string, clerkId: string, updateJournalDto: UpdateJournalDto): Promise<Journal> {
    const journal = await this.findOne(id, clerkId);

    Object.assign(journal, updateJournalDto);
    return this.journalRepository.save(journal);
  }

  async remove(id: string, clerkId: string): Promise<void> {
    const journal = await this.findOne(id, clerkId);
    await this.journalRepository.remove(journal);
  }

  /**
   * Enable sharing for a journal and generate a share token
   */
  async enableSharing(id: string, clerkId: string): Promise<{ shareToken: string; shareUrl: string }> {
    const journal = await this.findOne(id, clerkId);

    // Generate a new token if one doesn't exist
    if (!journal.share_token) {
      journal.share_token = randomBytes(16).toString('hex');
    }

    journal.is_shared = true;
    journal.shared_at = new Date();
    await this.journalRepository.save(journal);

    return {
      shareToken: journal.share_token,
      shareUrl: `/shared/${journal.share_token}`,
    };
  }

  /**
   * Disable sharing for a journal
   */
  async disableSharing(id: string, clerkId: string): Promise<void> {
    const journal = await this.findOne(id, clerkId);
    journal.is_shared = false;
    await this.journalRepository.save(journal);
  }

  /**
   * Get sharing status for a journal
   */
  async getSharingStatus(id: string, clerkId: string): Promise<{
    isShared: boolean;
    shareToken: string | null;
    shareUrl: string | null;
    sharedAt: Date | null;
  }> {
    const journal = await this.findOne(id, clerkId);

    return {
      isShared: journal.is_shared,
      shareToken: journal.is_shared ? journal.share_token : null,
      shareUrl: journal.is_shared ? `/shared/${journal.share_token}` : null,
      sharedAt: journal.shared_at,
    };
  }

  /**
   * Get a shared journal by its share token (public - no auth required)
   */
  async findByShareToken(shareToken: string): Promise<{
    journal: Partial<Journal>;
    entries: Entry[];
  }> {
    const journal = await this.journalRepository.findOne({
      where: { share_token: shareToken, is_shared: true },
      relations: ['participants'],
    });

    if (!journal) {
      throw new NotFoundException('Shared journal not found or sharing is disabled');
    }

    // Get entries for the shared journal
    const entries = await this.entryRepository.find({
      where: { journal_id: journal.id, is_hidden: false },
      relations: ['participant', 'media_attachments'],
      order: { created_at: 'DESC' },
    });

    // Return limited journal info for privacy
    return {
      journal: {
        id: journal.id,
        title: journal.title,
        description: journal.description,
        template_type: journal.template_type,
        created_at: journal.created_at,
        participants: journal.participants?.map(p => ({
          id: p.id,
          display_name: p.display_name,
          relationship: p.relationship,
          avatar_url: p.avatar_url,
        })) as any,
      },
      entries,
    };
  }
}
