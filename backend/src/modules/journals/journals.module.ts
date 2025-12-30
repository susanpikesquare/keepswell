import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalsController } from './journals.controller';
import { JournalsService } from './journals.service';
import { Journal, User, Entry } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Journal, User, Entry])],
  controllers: [JournalsController],
  providers: [JournalsService],
  exports: [JournalsService],
})
export class JournalsModule {}
