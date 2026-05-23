import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';

@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Mobile app calls this on app open (after sign-in) with the device's
   * Expo push token. Idempotent — repeated calls update the same row.
   */
  @Post('tokens')
  async register(@CurrentUser() auth: AuthUser, @Body() body: RegisterTokenDto) {
    const user = await this.userRepo.findOne({ where: { clerk_id: auth.clerkId } });
    if (!user) {
      // The Clerk session is valid but we haven't synced this user into our
      // DB yet — caller should hit auth/sync first.
      throw new Error('User not found; sync user before registering token');
    }
    const row = await this.notifications.registerToken(
      user.id,
      body.token,
      body.platform ?? 'ios',
      body.device_name,
    );
    return { id: row.id, registered: true };
  }

  /**
   * Mobile app calls this on sign-out so the token isn't reused for the
   * next user on the same device.
   */
  @Delete('tokens/:token')
  async unregister(@Param('token') token: string) {
    await this.notifications.unregisterToken(token);
    return { unregistered: true };
  }

  // ---- Per-journal preferences -----------------------------------------

  /** Read prefs for the signed-in user on a specific journal. */
  @Get('preferences/:journalId')
  async getPreferences(
    @CurrentUser() auth: AuthUser,
    @Param('journalId') journalId: string,
  ) {
    const user = await this.userRepo.findOne({ where: { clerk_id: auth.clerkId } });
    if (!user) throw new NotFoundException('User not found');
    return this.notifications.getPreferences(user.id, journalId);
  }

  /** Upsert prefs. Any omitted field keeps its current value (or default). */
  @Put('preferences/:journalId')
  async updatePreferences(
    @CurrentUser() auth: AuthUser,
    @Param('journalId') journalId: string,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    const user = await this.userRepo.findOne({ where: { clerk_id: auth.clerkId } });
    if (!user) throw new NotFoundException('User not found');
    return this.notifications.upsertPreferences(user.id, journalId, body);
  }
}
