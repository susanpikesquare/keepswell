import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import {
  Comment,
  Entry,
  Journal,
  Participant,
  User,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Entry, Journal, Participant, User]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
