import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { SubscriptionService } from './subscription.service';
import { SmsLimitsService } from '../sms/sms-limits.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';
import type { AuthUser } from '../../common/decorators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly subscriptionService: SubscriptionService,
    private readonly smsLimitsService: SmsLimitsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a Stripe checkout session for subscription
   */
  @Post('create-checkout-session')
  @UseGuards(ClerkAuthGuard)
  async createCheckoutSession(
    @CurrentUser() user: AuthUser,
    @Body('returnUrl') returnUrl: string,
    @Body('billingPeriod') billingPeriod?: 'monthly' | 'yearly',
  ) {
    return this.paymentsService.createCheckoutSession(
      user.clerkId,
      returnUrl,
      billingPeriod || 'monthly',
    );
  }

  /**
   * Create a Stripe customer portal session
   */
  @Post('create-portal-session')
  @UseGuards(ClerkAuthGuard)
  async createPortalSession(
    @CurrentUser() user: AuthUser,
    @Body('returnUrl') returnUrl: string,
  ) {
    return this.paymentsService.createPortalSession(user.clerkId, returnUrl);
  }

  /**
   * Get current user's subscription status
   */
  @Get('subscription-status')
  @UseGuards(ClerkAuthGuard)
  async getSubscriptionStatus(@CurrentUser() user: AuthUser) {
    return this.paymentsService.getSubscriptionStatus(user.clerkId);
  }

  /**
   * Get current user's SMS usage statistics (legacy)
   */
  @Get('usage-stats')
  @UseGuards(ClerkAuthGuard)
  async getUsageStats(@CurrentUser() authUser: AuthUser) {
    const user = await this.userRepository.findOne({ where: { clerk_id: authUser.clerkId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return this.smsLimitsService.getUsageStats(user.id);
  }

  /**
   * Get current user's usage limits (journals, contributors, SMS)
   */
  @Get('usage-limits')
  @UseGuards(ClerkAuthGuard)
  async getUsageLimits(@CurrentUser() authUser: AuthUser) {
    return this.subscriptionService.getUsageLimitsByClerkId(authUser.clerkId);
  }

  /**
   * Stripe webhook endpoint
   */
  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody;
    if (!payload) {
      throw new BadRequestException('No raw body found');
    }
    await this.paymentsService.handleWebhook(payload, signature);
    return { received: true };
  }
}
