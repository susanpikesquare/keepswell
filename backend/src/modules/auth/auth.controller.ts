import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SyncUserDto } from './dto/sync-user.dto';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/decorators';
import { User } from '../../database/entities';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncUser(@Body() syncUserDto: SyncUserDto): Promise<User> {
    return this.authService.syncUser(syncUserDto);
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: AuthUser): Promise<User | null> {
    return this.authService.findByClerkId(user.clerkId);
  }
}
