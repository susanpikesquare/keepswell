import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalParticipantsController, ParticipantsController, ParticipantMagicLinkController, AdminParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { Participant, Journal, User, Entry } from '../../database/entities';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Participant, Journal, User, Entry]), SmsModule],
  controllers: [JournalParticipantsController, ParticipantsController, ParticipantMagicLinkController, AdminParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
