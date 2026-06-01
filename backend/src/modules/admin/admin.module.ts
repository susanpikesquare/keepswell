import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  User,
  Journal,
  Entry,
  Participant,
  PushToken,
  NotificationPreference,
} from '../../database/entities';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Journal,
      Entry,
      Participant,
      // Admin cascade-delete needs these — there's no FK from these tables
      // to users so we clean them up explicitly before deleting the user.
      PushToken,
      NotificationPreference,
    ]),
    forwardRef(() => SchedulerModule),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard, TypeOrmModule],
})
export class AdminModule {}
