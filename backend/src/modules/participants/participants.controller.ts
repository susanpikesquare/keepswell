import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators';
import { Entry } from '../../database/entities';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

// Controller for journal-scoped participant routes
@Controller('journals/:journalId/participants')
@UseGuards(ClerkAuthGuard)
export class JournalParticipantsController {
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
}

// Controller for participant-scoped routes (update, delete, resend)
@Controller('participants')
@UseGuards(ClerkAuthGuard)
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() data: Partial<{ display_name: string; status: string; relationship: string }>,
  ) {
    return this.participantsService.update(id, user.clerkId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.participantsService.remove(id, user.clerkId);
  }

  @Post(':id/resend-invite')
  resendInvite(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.participantsService.resendInvite(id, user.clerkId);
  }
}

// Public controller for magic link access
@Controller('p')
export class ParticipantMagicLinkController {
  constructor(
    private readonly participantsService: ParticipantsService,
    @InjectRepository(Entry)
    private entryRepo: Repository<Entry>,
  ) {}

  @Public()
  @Get(':token')
  async getJournalByMagicLink(@Param('token') token: string) {
    const participant = await this.participantsService.findByMagicToken(token);

    if (!participant) {
      throw new NotFoundException('Invalid or expired link');
    }

    // Get entries for this journal
    const entries = await this.entryRepo.find({
      where: { journal_id: participant.journal_id },
      relations: ['participant', 'media_attachments'],
      order: { created_at: 'DESC' },
      take: 100,
    });

    return {
      participant: {
        id: participant.id,
        display_name: participant.display_name,
        status: participant.status,
      },
      journal: {
        id: participant.journal.id,
        title: participant.journal.title,
        description: participant.journal.description,
        cover_image_url: participant.journal.cover_image_url,
        owner_name: participant.journal.owner?.full_name || 'Unknown',
      },
      entries: entries.map((entry) => ({
        id: entry.id,
        content: entry.content,
        entry_type: entry.entry_type,
        created_at: entry.created_at,
        participant: entry.participant
          ? {
              display_name: entry.participant.display_name,
              avatar_url: entry.participant.avatar_url,
            }
          : null,
        media_attachments: entry.media_attachments?.map((m) => ({
          id: m.id,
          stored_url: m.stored_url,
          thumbnail_url: m.thumbnail_url,
          media_type: m.media_type,
        })),
      })),
    };
  }
}
