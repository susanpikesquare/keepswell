import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalParticipantsController, ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { Participant, Journal, User } from '../../database/entities';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Participant, Journal, User]), SmsModule],
  controllers: [JournalParticipantsController, ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
