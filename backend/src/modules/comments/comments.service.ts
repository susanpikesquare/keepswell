import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  Comment,
  Entry,
  Journal,
  Participant,
  User,
} from '../../database/entities';
import { CreateCommentDto, UpdateCommentDto } from './dto';

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
  depth: number;
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,
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
   * Build a tree structure from flat list of comments
   */
  private buildCommentTree(comments: Comment[]): CommentWithReplies[] {
    const commentMap = new Map<string, CommentWithReplies>();
    const roots: CommentWithReplies[] = [];

    // First pass: create enhanced comment objects
    for (const comment of comments) {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
        depth: 0,
      });
    }

    // Second pass: build the tree
    for (const comment of comments) {
      const enhancedComment = commentMap.get(comment.id)!;

      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          enhancedComment.depth = parent.depth + 1;
          parent.replies.push(enhancedComment);
        } else {
          // Orphaned comment, treat as root
          roots.push(enhancedComment);
        }
      } else {
        roots.push(enhancedComment);
      }
    }

    return roots;
  }

  /**
   * Get all comments for an entry (threaded)
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

    // Get all comments with participants, ordered by creation time
    const comments = await this.commentRepo.find({
      where: { entry_id: entryId, is_hidden: false },
      relations: ['participant'],
      order: { created_at: 'ASC' },
    });

    // Build threaded structure
    const threaded = this.buildCommentTree(comments);

    return {
      entry_id: entryId,
      comments: threaded,
      total: comments.length,
    };
  }

  /**
   * Create a comment on an entry
   */
  async create(
    entryId: string,
    clerkId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
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
      throw new ForbiddenException('Not authorized to comment on this entry');
    }

    // Verify parent comment exists if specified
    if (dto.parent_id) {
      const parentComment = await this.commentRepo.findOne({
        where: { id: dto.parent_id, entry_id: entryId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    // Find or create owner participant
    let participant = await this.participantRepo.findOne({
      where: { journal_id: entry.journal_id, email: user.email },
    });

    if (!participant) {
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
    }

    // Create the comment
    const comment = await this.commentRepo.save({
      entry_id: entryId,
      participant_id: participant.id,
      parent_id: dto.parent_id || null,
      content: dto.content,
    });

    this.logger.log(
      `Comment created by ${participant.display_name} on entry ${entryId}`,
    );

    // Return with participant relation
    return this.commentRepo.findOne({
      where: { id: comment.id },
      relations: ['participant'],
    }) as Promise<Comment>;
  }

  /**
   * Update a comment
   */
  async update(
    commentId: string,
    clerkId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const user = await this.getUserByClerkId(clerkId);

    // Find the comment with relations
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['entry', 'entry.journal', 'participant'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.entry.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to update this comment');
    }

    // Update the comment
    if (dto.content !== undefined) {
      comment.content = dto.content;
    }
    if (dto.is_hidden !== undefined) {
      comment.is_hidden = dto.is_hidden;
    }

    await this.commentRepo.save(comment);

    this.logger.log(`Comment ${commentId} updated`);

    return this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['participant'],
    }) as Promise<Comment>;
  }

  /**
   * Delete a comment
   */
  async remove(commentId: string, clerkId: string): Promise<void> {
    const user = await this.getUserByClerkId(clerkId);

    // Find the comment with relations
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['entry', 'entry.journal'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.entry.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to delete this comment');
    }

    // Delete cascades to replies
    await this.commentRepo.delete(commentId);

    this.logger.log(`Comment ${commentId} deleted`);
  }

  /**
   * Get a single comment by ID
   */
  async findOne(commentId: string, clerkId: string): Promise<Comment> {
    const user = await this.getUserByClerkId(clerkId);

    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['entry', 'entry.journal', 'participant'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.entry.journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to view this comment');
    }

    return comment;
  }
}
