import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminService, PlatformStats, UserDetails } from './admin.service';
import { AdminGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Public } from '../../common/decorators';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // One-time setup endpoint - no auth required, uses secret
  @Public()
  @Post('setup')
  async setupInitialAdmin(@Body() body: { email: string; secret: string }) {
    if (body.secret !== 'keepswell-setup-2024') {
      throw new BadRequestException('Invalid setup secret');
    }
    const user = await this.adminService.makeUserAdminByEmail(body.email);
    if (!user) {
      throw new BadRequestException('User not found. Make sure you have signed in first.');
    }
    return { success: true, message: `Admin access granted to ${body.email}` };
  }

  @UseGuards(AdminGuard)
  @Get('stats')
  async getStats(): Promise<PlatformStats> {
    return this.adminService.getPlatformStats();
  }

  @UseGuards(AdminGuard)
  @Get('users')
  async getUsers(): Promise<UserDetails[]> {
    return this.adminService.getAllUsers();
  }

  @UseGuards(AdminGuard)
  @Patch('users/:id/admin')
  async setAdminStatus(
    @Param('id') userId: string,
    @Body() body: { is_admin: boolean },
  ) {
    return this.adminService.setAdminStatus(userId, body.is_admin);
  }

  @UseGuards(AdminGuard)
  @Get('me')
  async checkAdminAccess(@CurrentUser() user: any) {
    return { isAdmin: true, clerkId: user.id };
  }
}
