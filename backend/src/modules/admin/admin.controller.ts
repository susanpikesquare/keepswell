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
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AdminService, PlatformStats, UserDetails } from './admin.service';
import { AdminGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Public } from '../../common/decorators';
import { SchedulerService } from '../scheduler/scheduler.service';
import { seedAllTemplates } from '../../database/seeds/all-templates.seed';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    @InjectDataSource() private dataSource: DataSource,
    private readonly schedulerService: SchedulerService,
  ) {}

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

  // One-time tier setup endpoint - no auth required, uses secret
  @Public()
  @Post('setup-tier')
  async setupTier(@Body() body: { email: string; tier: 'free' | 'premium' | 'pro'; secret: string }) {
    if (body.secret !== 'keepswell-setup-2024') {
      throw new BadRequestException('Invalid setup secret');
    }
    if (!['free', 'premium', 'pro'].includes(body.tier)) {
      throw new BadRequestException('Invalid tier. Must be: free, premium, or pro');
    }
    const user = await this.adminService.setTierByEmail(body.email, body.tier);
    if (!user) {
      throw new BadRequestException('User not found. Make sure you have signed in first.');
    }
    return { success: true, message: `Tier set to ${body.tier} for ${body.email}` };
  }

  // Sync database schema - creates missing tables
  @Public()
  @Post('sync-database')
  async syncDatabase(@Body() body: { secret: string }) {
    if (body.secret !== 'keepswell-setup-2024') {
      throw new BadRequestException('Invalid setup secret');
    }
    try {
      await this.dataSource.synchronize();
      return {
        success: true,
        message: 'Database synchronized successfully. Missing tables have been created.'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Database sync failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Debug endpoint to check user status - no admin required
  @Get('debug/:email')
  @Public()
  async debugUser(@Param('email') email: string) {
    const user = await this.adminService.getUserByEmail(email);
    if (!user) {
      return { found: false, message: 'User not found in database' };
    }
    return {
      found: true,
      id: user.id,
      email: user.email,
      clerk_id: user.clerk_id,
      is_admin: user.is_admin,
    };
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
  @Patch('users/:id/tier')
  async setSubscriptionTier(
    @Param('id') userId: string,
    @Body() body: { tier: 'free' | 'premium' | 'pro' },
  ) {
    if (!['free', 'premium', 'pro'].includes(body.tier)) {
      throw new BadRequestException('Invalid tier. Must be: free, premium, or pro');
    }
    return this.adminService.setSubscriptionTier(userId, body.tier);
  }

  @UseGuards(AdminGuard)
  @Get('me')
  async checkAdminAccess(@CurrentUser() user: any) {
    return { isAdmin: true, clerkId: user.id };
  }

  // Manually trigger prompts for a journal (for testing)
  @Public()
  @Post('trigger-prompts/:journalId')
  async triggerPrompts(
    @Param('journalId') journalId: string,
    @Body() body: { secret: string },
  ) {
    if (body.secret !== 'keepswell-setup-2024') {
      throw new BadRequestException('Invalid secret');
    }
    return this.schedulerService.triggerPromptForJournal(journalId);
  }

  // Run the full scheduler check manually (for testing)
  @Public()
  @Post('run-scheduler')
  async runScheduler(@Body() body: { secret: string }) {
    if (body.secret !== 'keepswell-setup-2024') {
      throw new BadRequestException('Invalid secret');
    }
    await this.schedulerService.handlePromptScheduling();
    return { success: true, message: 'Scheduler check completed' };
  }

  // Seed templates and prompts
  @Public()
  @Post('seed-templates')
  async seedTemplates(@Body() body: { secret: string }) {
    if (body.secret !== 'keepswell-setup-2024') {
      throw new BadRequestException('Invalid secret');
    }
    try {
      await seedAllTemplates(this.dataSource);
      return { success: true, message: 'Templates and prompts seeded successfully' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to seed templates',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
