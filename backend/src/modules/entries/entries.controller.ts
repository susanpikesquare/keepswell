import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EntriesService } from './entries.service';
import { SimulateEntryDto, WebEntryDto } from './dto/create-entry.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(ClerkAuthGuard)
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  /**
   * List entries for a journal
   */
  @Get('journals/:journalId/entries')
  findByJournal(
    @Param('journalId') journalId: string,
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.entriesService.findByJournal(journalId, user.clerkId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * Simulate an SMS entry for testing
   * POST /api/journals/:journalId/entries/simulate
   */
  @Post('journals/:journalId/entries/simulate')
  simulateEntry(
    @Param('journalId') journalId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SimulateEntryDto,
  ) {
    return this.entriesService.simulateEntry(journalId, user.clerkId, dto);
  }

  /**
   * Create an entry via web upload (FREE - no SMS limits)
   * POST /api/journals/:journalId/entries
   * Allows journal owner to add memories directly without SMS
   */
  @Post('journals/:journalId/entries')
  createWebEntry(
    @Param('journalId') journalId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: WebEntryDto,
  ) {
    return this.entriesService.createWebEntry(journalId, user.clerkId, dto);
  }

  /**
   * Get a single entry
   */
  @Get('entries/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.entriesService.findOne(id, user.clerkId);
  }

  /**
   * Update entry (pin/hide)
   */
  @Patch('entries/:id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() updates: { is_hidden?: boolean; is_pinned?: boolean },
  ) {
    return this.entriesService.update(id, user.clerkId, updates);
  }

  /**
   * Delete an entry
   */
  @Delete('entries/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.entriesService.remove(id, user.clerkId);
  }

  /**
   * Generate demo data for a journal
   * POST /api/journals/:journalId/demo-data
   */
  @Post('journals/:journalId/demo-data')
  generateDemoData(
    @Param('journalId') journalId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.entriesService.generateDemoData(journalId, user.clerkId);
  }
}
