import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import {
  Reaction,
  Entry,
  Journal,
  Participant,
  User,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reaction, Entry, Journal, Participant, User]),
  ],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
