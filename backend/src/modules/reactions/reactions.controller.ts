import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(ClerkAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  /**
   * Get all reactions for an entry, grouped by emoji
   * GET /api/entries/:entryId/reactions
   */
  @Get('entries/:entryId/reactions')
  findByEntry(
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reactionsService.findByEntry(entryId, user.clerkId);
  }

  /**
   * Add a reaction to an entry
   * POST /api/entries/:entryId/reactions
   */
  @Post('entries/:entryId/reactions')
  create(
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReactionDto,
  ) {
    return this.reactionsService.create(entryId, user.clerkId, dto);
  }

  /**
   * Toggle a reaction (add if doesn't exist, remove if exists)
   * POST /api/entries/:entryId/reactions/toggle
   */
  @Post('entries/:entryId/reactions/toggle')
  toggle(
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReactionDto,
  ) {
    return this.reactionsService.toggle(entryId, user.clerkId, dto);
  }

  /**
   * Remove a reaction from an entry
   * DELETE /api/entries/:entryId/reactions/:emoji
   */
  @Delete('entries/:entryId/reactions/:emoji')
  remove(
    @Param('entryId') entryId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: AuthUser,
    @Query('participant_id') participantId?: string,
  ) {
    return this.reactionsService.remove(entryId, emoji, user.clerkId, participantId);
  }
}
