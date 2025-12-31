import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService, PlatformStats, UserDetails } from './admin.service';
import { AdminGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats(): Promise<PlatformStats> {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  async getUsers(): Promise<UserDetails[]> {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/admin')
  async setAdminStatus(
    @Param('id') userId: string,
    @Body() body: { is_admin: boolean },
  ) {
    return this.adminService.setAdminStatus(userId, body.is_admin);
  }

  @Get('me')
  async checkAdminAccess(@CurrentUser() user: any) {
    return { isAdmin: true, clerkId: user.id };
  }
}
