import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { Journal, Entry, User, Participant } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Journal, Entry, User, Participant])],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
