import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Entry } from './entry.entity';

@Entity('media_attachments')
export class MediaAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entry_id: string;

  @ManyToOne(() => Entry, (entry) => entry.media_attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'entry_id' })
  entry: Entry;

  @Column({ type: 'text' })
  original_url: string; // Twilio URL (temporary)

  @Column({ type: 'text' })
  stored_url: string; // Our S3/Cloudinary URL

  @Column()
  media_type: string; // 'image/jpeg', 'image/png', etc.

  @Column({ type: 'int', nullable: true })
  file_size: number;

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'int', nullable: true })
  height: number;

  @Column({ type: 'text', nullable: true })
  thumbnail_url: string;

  @CreateDateColumn()
  created_at: Date;
}
