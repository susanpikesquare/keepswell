import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Entry } from './entry.entity';
import { Participant } from './participant.entity';

// Allowed reaction types
export const ALLOWED_REACTIONS = [
  'heart',
  'fire',
  'laugh',
  'sad',
  'wow',
  'clap',
] as const;

export type ReactionType = (typeof ALLOWED_REACTIONS)[number];

// Emoji mapping for display
export const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  heart: '❤️',
  fire: '🔥',
  laugh: '😂',
  sad: '😢',
  wow: '😮',
  clap: '👏',
};

@Entity('reactions')
@Unique(['entry_id', 'participant_id', 'emoji'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entry_id: string;

  @ManyToOne(() => Entry, (entry) => entry.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'entry_id' })
  entry: Entry;

  @Column()
  participant_id: string;

  @ManyToOne(() => Participant, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ length: 16 })
  emoji: string; // 'heart', 'fire', 'laugh', 'sad', 'wow', 'clap'

  @CreateDateColumn()
  created_at: Date;
}
