import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { Entry, Participant, MediaAttachment } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Entry, Participant, MediaAttachment])],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
