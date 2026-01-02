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
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';
import type { AuthUser } from '../../common/decorators';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a Stripe checkout session for subscription
   */
  @Post('create-checkout-session')
  @UseGuards(ClerkAuthGuard)
  async createCheckoutSession(
    @CurrentUser() user: AuthUser,
    @Body('returnUrl') returnUrl: string,
  ) {
    return this.paymentsService.createCheckoutSession(user.clerkId, returnUrl);
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
