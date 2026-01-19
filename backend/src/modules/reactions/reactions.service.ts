import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reaction,
  Entry,
  Journal,
  Participant,
  User,
  ReactionType,
} from '../../database/entities';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  constructor(
    @InjectRepository(Reaction)
    private reactionRepo: Repository<Reaction>,
    @InjectRepository(Entry)
    private entryRepo: Repository<Entry>,
    @InjectRepository(Journal)
    private journalRepo: Repository<Journal>,
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
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

  /**
   * Get all reactions for an entry, grouped by emoji
   */
  async findByEntry(entryId: string, clerkId: string) {
    const user = await this.getUserByClerkId(clerkId);

    // Find the entry and verify ownership
    const entry = await this.entryRepo.findOne({
      where: { id: entryId },
      relations: ['journal'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to view this entry');
    }

    // Get all reactions with participants
    const reactions = await this.reactionRepo.find({
      where: { entry_id: entryId },
      relations: ['participant'],
      order: { created_at: 'ASC' },
    });

    // Group by emoji and count
    const grouped: Record<
      string,
      { count: number; participants: Array<{ id: string; display_name: string }> }
    > = {};

    for (const reaction of reactions) {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = { count: 0, participants: [] };
      }
      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].participants.push({
        id: reaction.participant.id,
        display_name: reaction.participant.display_name,
      });
    }

    return {
      entry_id: entryId,
      reactions: grouped,
      total: reactions.length,
    };
  }

  /**
   * Add a reaction to an entry
   */
  async create(
    entryId: string,
    clerkId: string,
    dto: CreateReactionDto,
  ): Promise<Reaction> {
    const user = await this.getUserByClerkId(clerkId);

    // Find the entry and verify ownership
    const entry = await this.entryRepo.findOne({
      where: { id: entryId },
      relations: ['journal'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to react to this entry');
    }

    // Find or get the participant
    let participant: Participant;

    if (dto.participant_id) {
      // Use specified participant
      const specifiedParticipant = await this.participantRepo.findOne({
        where: { id: dto.participant_id, journal_id: entry.journal_id },
      });

      if (!specifiedParticipant) {
        throw new NotFoundException('Participant not found');
      }
      participant = specifiedParticipant;
    } else {
      // Find owner participant by email first
      let ownerParticipant = await this.participantRepo.findOne({
        where: {
          journal_id: entry.journal_id,
          email: user.email,
        },
      });

      // If not found by email, try placeholder phone number
      if (!ownerParticipant) {
        const placeholderPhone = `owner-${user.id}`;
        ownerParticipant = await this.participantRepo.findOne({
          where: { journal_id: entry.journal_id, phone_number: placeholderPhone },
        });
      }

      // If still not found, create a new owner participant
      if (!ownerParticipant) {
        try {
          // Use a placeholder phone number if user doesn't have one (phone is required in participants table)
          ownerParticipant = await this.participantRepo.save({
            journal_id: entry.journal_id,
            display_name: user.full_name || 'Me',
            email: user.email,
            phone_number: user.phone_number || `owner-${user.id}`,
            status: 'active',
            opted_in: true,
            relationship: 'Owner',
          });
        } catch (error) {
          // If unique constraint violation, try to find existing owner
          this.logger.warn(`Failed to create participant, trying to find existing: ${error.message}`);
          ownerParticipant = await this.participantRepo.findOne({
            where: { journal_id: entry.journal_id, relationship: 'Owner' },
          });
          if (!ownerParticipant) {
            throw error;
          }
        }
      }
      participant = ownerParticipant;
    }

    // Check if reaction already exists
    const existingReaction = await this.reactionRepo.findOne({
      where: {
        entry_id: entryId,
        participant_id: participant.id,
        emoji: dto.emoji,
      },
    });

    if (existingReaction) {
      throw new ConflictException('Reaction already exists');
    }

    // Create the reaction
    const reaction = await this.reactionRepo.save({
      entry_id: entryId,
      participant_id: participant.id,
      emoji: dto.emoji as ReactionType,
    });

    this.logger.log(
      `Reaction ${dto.emoji} added by ${participant.display_name} on entry ${entryId}`,
    );

    // Return with participant relation
    return this.reactionRepo.findOne({
      where: { id: reaction.id },
      relations: ['participant'],
    }) as Promise<Reaction>;
  }

  /**
   * Remove a reaction from an entry
   */
  async remove(
    entryId: string,
    emoji: string,
    clerkId: string,
    participantId?: string,
  ): Promise<void> {
    const user = await this.getUserByClerkId(clerkId);

    // Find the entry and verify ownership
    const entry = await this.entryRepo.findOne({
      where: { id: entryId },
      relations: ['journal'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to remove reactions from this entry');
    }

    // Find the participant
    let participant: Participant | null;

    if (participantId) {
      participant = await this.participantRepo.findOne({
        where: { id: participantId, journal_id: entry.journal_id },
      });
    } else {
      participant = await this.participantRepo.findOne({
        where: { journal_id: entry.journal_id, email: user.email },
      });
    }

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Find and remove the reaction
    const reaction = await this.reactionRepo.findOne({
      where: {
        entry_id: entryId,
        participant_id: participant.id,
        emoji: emoji,
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionRepo.delete(reaction.id);

    this.logger.log(
      `Reaction ${emoji} removed by ${participant.display_name} from entry ${entryId}`,
    );
  }

  /**
   * Toggle a reaction (add if doesn't exist, remove if exists)
   */
  async toggle(
    entryId: string,
    clerkId: string,
    dto: CreateReactionDto,
  ): Promise<{ action: 'added' | 'removed'; reaction?: Reaction }> {
    const user = await this.getUserByClerkId(clerkId);

    // Find the entry and verify ownership
    const entry = await this.entryRepo.findOne({
      where: { id: entryId },
      relations: ['journal'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to react to this entry');
    }

    // Find the participant
    let participant: Participant | null;

    if (dto.participant_id) {
      participant = await this.participantRepo.findOne({
        where: { id: dto.participant_id, journal_id: entry.journal_id },
      });
    } else {
      // First try to find by email
      participant = await this.participantRepo.findOne({
        where: { journal_id: entry.journal_id, email: user.email },
      });

      // If not found by email, try to find by placeholder phone number (for previously created owner participants)
      if (!participant) {
        const placeholderPhone = `owner-${user.id}`;
        participant = await this.participantRepo.findOne({
          where: { journal_id: entry.journal_id, phone_number: placeholderPhone },
        });
      }

      // If still not found, create a new owner participant
      if (!participant) {
        try {
          // Use a placeholder phone number if user doesn't have one (phone is required in participants table)
          participant = await this.participantRepo.save({
            journal_id: entry.journal_id,
            display_name: user.full_name || 'Me',
            email: user.email,
            phone_number: user.phone_number || `owner-${user.id}`,
            status: 'active',
            opted_in: true,
            relationship: 'Owner',
          });
        } catch (error) {
          // If unique constraint violation, try to find the existing participant
          this.logger.warn(`Failed to create participant, trying to find existing: ${error.message}`);
          participant = await this.participantRepo.findOne({
            where: { journal_id: entry.journal_id, relationship: 'Owner' },
          });
        }
      }
    }

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Check if reaction exists
    const existingReaction = await this.reactionRepo.findOne({
      where: {
        entry_id: entryId,
        participant_id: participant.id,
        emoji: dto.emoji,
      },
    });

    if (existingReaction) {
      // Remove the reaction
      await this.reactionRepo.delete(existingReaction.id);
      this.logger.log(
        `Reaction ${dto.emoji} toggled off by ${participant.display_name} on entry ${entryId}`,
      );
      return { action: 'removed' };
    } else {
      // Add the reaction
      const reaction = await this.reactionRepo.save({
        entry_id: entryId,
        participant_id: participant.id,
        emoji: dto.emoji as ReactionType,
      });

      const reactionWithParticipant = await this.reactionRepo.findOne({
        where: { id: reaction.id },
        relations: ['participant'],
      });

      this.logger.log(
        `Reaction ${dto.emoji} toggled on by ${participant.display_name} on entry ${entryId}`,
      );

      return { action: 'added', reaction: reactionWithParticipant! };
    }
  }
}
