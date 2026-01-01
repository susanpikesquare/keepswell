import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { CurrentUser, Public } from '../../common/decorators';
import type { AuthUser } from '../../common/decorators';

@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() createJournalDto: CreateJournalDto,
  ) {
    return this.journalsService.create(user.clerkId, createJournalDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.journalsService.findAllByUser(user.clerkId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.journalsService.findOne(id, user.clerkId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateJournalDto: UpdateJournalDto,
  ) {
    return this.journalsService.update(id, user.clerkId, updateJournalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.journalsService.remove(id, user.clerkId);
  }

  // ============ Sharing Endpoints ============

  /**
   * Get sharing status for a journal
   */
  @Get(':id/share')
  getSharingStatus(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.journalsService.getSharingStatus(id, user.clerkId);
  }

  /**
   * Enable sharing and get share link
   */
  @Post(':id/share')
  enableSharing(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.journalsService.enableSharing(id, user.clerkId);
  }

  /**
   * Disable sharing
   */
  @Delete(':id/share')
  @HttpCode(HttpStatus.NO_CONTENT)
  disableSharing(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.journalsService.disableSharing(id, user.clerkId);
  }

  /**
   * Get shared journal by token (PUBLIC - no auth required)
   * Note: This endpoint returns journal data without verification.
   * For protected access, use the verify endpoints below.
   */
  @Public()
  @Get('shared/:token')
  getSharedJournal(@Param('token') token: string) {
    return this.journalsService.findByShareToken(token);
  }

  // ============ Phone Verification Endpoints ============

  /**
   * Send verification code to a phone number (PUBLIC)
   */
  @Public()
  @Post('shared/:token/verify/send')
  sendVerificationCode(
    @Param('token') token: string,
    @Body('phoneNumber') phoneNumber: string,
  ) {
    return this.journalsService.sendVerificationCode(token, phoneNumber);
  }

  /**
   * Verify code and get shared journal (PUBLIC)
   */
  @Public()
  @Post('shared/:token/verify')
  verifyAndGetSharedJournal(
    @Param('token') token: string,
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ) {
    return this.journalsService.verifyAndGetSharedJournal(token, phoneNumber, code);
  }
}
