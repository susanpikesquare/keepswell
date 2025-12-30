import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { Entry, Journal, Participant, MediaAttachment, User } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Entry, Journal, Participant, MediaAttachment, User])],
  controllers: [EntriesController],
  providers: [EntriesService],
  exports: [EntriesService],
})
export class EntriesModule {}
