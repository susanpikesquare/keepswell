import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { Entry, Participant, MediaAttachment, Journal } from '../../database/entities';
import { StorageModule } from '../storage/storage.module';
import { JournalsModule } from '../journals/journals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entry, Participant, MediaAttachment, Journal]),
    StorageModule,
    forwardRef(() => JournalsModule),
  ],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
