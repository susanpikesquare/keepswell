import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { User } from '../../database/entities';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured');
    }
    this.stripe = new Stripe(secretKey || '');
  }

  /**
   * Get or create a Stripe customer for a user
   */
  async getOrCreateCustomer(user: User): Promise<string> {
    if (user.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.full_name || undefined,
      metadata: {
        userId: user.id,
        clerkId: user.clerk_id,
      },
    });

    await this.userRepository.update(user.id, {
      stripe_customer_id: customer.id,
    });

    this.logger.log(`Created Stripe customer ${customer.id} for user ${user.id}`);
    return customer.id;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    clerkId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const customerId = await this.getOrCreateCustomer(user);
    const priceId = this.configService.get<string>('stripe.priceIdMonthly');

    if (!priceId) {
      throw new BadRequestException('Stripe price not configured');
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    this.logger.log(`Created checkout session ${session.id} for user ${user.id}`);
    return { url: session.url! };
  }

  /**
   * Create a customer portal session to manage subscription
   */
  async createPortalSession(
    clerkId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripe_customer_id) {
      throw new BadRequestException('No subscription found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(clerkId: string): Promise<{
    tier: string;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      tier: user.subscription_tier,
      status: user.subscription_status,
      currentPeriodEnd: user.subscription_current_period_end,
      cancelAtPeriodEnd: user.subscription_cancel_at_period_end,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret || '');
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('No userId in checkout session metadata');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);

    await this.userRepository.update(userId, {
      subscription_tier: 'premium',
      subscription_status: 'active',
      stripe_subscription_id: subscription.id,
      subscription_current_period_end: new Date((subscription as any).current_period_end * 1000),
      subscription_cancel_at_period_end: (subscription as any).cancel_at_period_end,
    });

    this.logger.log(`User ${userId} upgraded to premium`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { stripe_subscription_id: subscription.id },
    });

    if (!user) {
      this.logger.warn(`No user found for subscription ${subscription.id}`);
      return;
    }

    const sub = subscription as any;
    const status = sub.status === 'active' ? 'active' : sub.status;

    await this.userRepository.update(user.id, {
      subscription_status: status,
      subscription_current_period_end: new Date(sub.current_period_end * 1000),
      subscription_cancel_at_period_end: sub.cancel_at_period_end,
    });

    this.logger.log(`Updated subscription status for user ${user.id}: ${status}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { stripe_subscription_id: subscription.id },
    });

    if (!user) {
      this.logger.warn(`No user found for subscription ${subscription.id}`);
      return;
    }

    await this.userRepository.update(user.id, {
      subscription_tier: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null as any,
      subscription_current_period_end: null as any,
      subscription_cancel_at_period_end: false,
    });

    this.logger.log(`User ${user.id} downgraded to free tier`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    const user = await this.userRepository.findOne({
      where: { stripe_subscription_id: subscriptionId },
    });

    if (!user) {
      this.logger.warn(`No user found for subscription ${subscriptionId}`);
      return;
    }

    await this.userRepository.update(user.id, {
      subscription_status: 'past_due',
    });

    this.logger.log(`Payment failed for user ${user.id}`);
  }
}
