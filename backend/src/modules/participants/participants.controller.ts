import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('journals/:journalId/participants')
@UseGuards(ClerkAuthGuard)
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  create(
    @Param('journalId') journalId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateParticipantDto,
  ) {
    return this.participantsService.create(journalId, user.clerkId, dto);
  }

  @Get()
  findAll(
    @Param('journalId') journalId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.participantsService.findByJournal(journalId, user.clerkId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.participantsService.remove(id, user.clerkId);
  }
}
