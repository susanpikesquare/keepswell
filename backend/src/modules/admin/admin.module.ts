import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { User, Journal, Entry, Participant } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Journal, Entry, Participant])],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard, TypeOrmModule],
})
export class AdminModule {}
