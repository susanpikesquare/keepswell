import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { User } from '../../database/entities';
import { PRICING } from './subscription.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;
  private isConfigured = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured - payment features disabled');
    } else {
      this.stripe = new Stripe(secretKey);
      this.isConfigured = true;
      this.logger.log('Stripe payment service initialized');
    }
  }

  private ensureConfigured(): void {
    if (!this.isConfigured || !this.stripe) {
      throw new BadRequestException('Payment service not configured');
    }
  }

  /**
   * Get or create a Stripe customer for a user
   */
  async getOrCreateCustomer(user: User): Promise<string> {
    this.ensureConfigured();

    if (user.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    const customer = await this.stripe!.customers.create({
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
   * Create a checkout session for Pro subscription (with 7-day free trial)
   */
  async createCheckoutSession(
    clerkId: string,
    returnUrl: string,
    billingPeriod: 'monthly' | 'yearly' = 'monthly',
  ): Promise<{ url: string }> {
    this.ensureConfigured();

    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const customerId = await this.getOrCreateCustomer(user);

    // Select price based on billing period
    const priceId = billingPeriod === 'yearly'
      ? this.configService.get<string>('stripe.priceIdYearly')
      : this.configService.get<string>('stripe.priceIdMonthly');

    if (!priceId) {
      throw new BadRequestException(`Stripe ${billingPeriod} price not configured`);
    }

    // Only offer trial if user has never had a Pro subscription
    const isFirstSubscription = !user.stripe_subscription_id;

    const session = await this.stripe!.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(isFirstSubscription ? {
        subscription_data: {
          trial_period_days: PRICING.pro.trialDays,
        },
      } : {}),
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        userId: user.id,
        billingPeriod,
        purchaseType: 'pro_subscription',
      },
    });

    this.logger.log(`Created checkout session ${session.id} for user ${user.id} (${billingPeriod}, trial: ${isFirstSubscription})`);
    return { url: session.url! };
  }

  /**
   * Create a checkout session for an Event Pass (one-time purchase)
   */
  async createEventPassCheckout(
    clerkId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    this.ensureConfigured();

    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const customerId = await this.getOrCreateCustomer(user);

    const priceId = this.configService.get<string>('stripe.priceIdEventPass');
    if (!priceId) {
      throw new BadRequestException('Event pass price not configured');
    }

    const session = await this.stripe!.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?success=true&type=event`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        userId: user.id,
        purchaseType: 'event_pass',
      },
    });

    this.logger.log(`Created event pass checkout session ${session.id} for user ${user.id}`);
    return { url: session.url! };
  }

  /**
   * Create a checkout session for participant bundle add-on (one-time purchase)
   */
  async createParticipantBundleCheckout(
    clerkId: string,
    returnUrl: string,
    quantity: number = 1,
  ): Promise<{ url: string }> {
    this.ensureConfigured();

    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const customerId = await this.getOrCreateCustomer(user);

    const priceId = this.configService.get<string>('stripe.priceIdParticipantBundle');
    if (!priceId) {
      throw new BadRequestException('Participant bundle price not configured');
    }

    const session = await this.stripe!.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      success_url: `${returnUrl}?success=true&type=participants`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        userId: user.id,
        purchaseType: 'participant_bundle',
        bundleQuantity: String(quantity),
      },
    });

    this.logger.log(`Created participant bundle checkout session ${session.id} for user ${user.id} (qty: ${quantity})`);
    return { url: session.url! };
  }

  /**
   * Create a customer portal session to manage subscription
   */
  async createPortalSession(
    clerkId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    this.ensureConfigured();

    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripe_customer_id) {
      throw new BadRequestException('No subscription found');
    }

    const session = await this.stripe!.billingPortal.sessions.create({
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
    eventPassExpiresAt: Date | null;
    extraParticipantSlots: number;
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
      eventPassExpiresAt: user.event_pass_expires_at,
      extraParticipantSlots: user.extra_participant_slots || 0,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    this.ensureConfigured();

    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    let event: Stripe.Event;
    try {
      event = this.stripe!.webhooks.constructEvent(payload, signature, webhookSecret || '');
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
    const purchaseType = session.metadata?.purchaseType;
    if (!userId) {
      this.logger.error('No userId in checkout session metadata');
      return;
    }

    switch (purchaseType) {
      case 'event_pass':
        await this.activateEventPass(userId);
        break;

      case 'participant_bundle': {
        const quantity = parseInt(session.metadata?.bundleQuantity || '1', 10);
        await this.addParticipantSlots(userId, quantity);
        break;
      }

      case 'pro_subscription':
      default: {
        // Pro subscription checkout
        const subscription = await this.stripe!.subscriptions.retrieve(session.subscription as string);
        const sub = subscription as any;

        await this.userRepository.update(userId, {
          subscription_tier: 'pro',
          subscription_status: sub.status === 'trialing' ? 'trialing' : 'active',
          stripe_subscription_id: subscription.id,
          subscription_current_period_end: new Date(sub.current_period_end * 1000),
          subscription_cancel_at_period_end: sub.cancel_at_period_end,
        });

        this.logger.log(`User ${userId} upgraded to Pro (status: ${sub.status})`);
        break;
      }
    }
  }

  private async activateEventPass(userId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PRICING.event.durationDays);

    await this.userRepository.update(userId, {
      subscription_tier: 'event',
      subscription_status: 'active',
      event_pass_expires_at: expiresAt,
    });

    this.logger.log(`Activated event pass for user ${userId}, expires ${expiresAt.toISOString()}`);
  }

  private async addParticipantSlots(userId: string, bundleQuantity: number): Promise<void> {
    const slotsToAdd = bundleQuantity * PRICING.addOns.participantBundle.slots;
    await this.userRepository.increment(
      { id: userId },
      'extra_participant_slots',
      slotsToAdd,
    );

    this.logger.log(`Added ${slotsToAdd} participant slots for user ${userId}`);
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
    const status = sub.status === 'trialing' ? 'trialing' : (sub.status === 'active' ? 'active' : sub.status);

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

  // ─── RevenueCat Integration ────────────────────────────────────────

  /**
   * Handle RevenueCat webhook events
   */
  async handleRevenueCatWebhook(
    payload: any,
    authHeader: string,
  ): Promise<void> {
    const expectedSecret = this.configService.get<string>('REVENUECAT_WEBHOOK_SECRET');
    if (expectedSecret && authHeader !== expectedSecret) {
      throw new BadRequestException('Invalid webhook authorization');
    }

    const event = payload?.event;
    if (!event) {
      this.logger.warn('RevenueCat webhook missing event data');
      return;
    }

    const appUserId = event.app_user_id;
    const eventType = event.type;

    this.logger.log(`RevenueCat webhook: ${eventType} for user ${appUserId}`);

    // app_user_id is the Clerk user ID we set during Purchases.logIn()
    const user = await this.userRepository.findOne({ where: { clerk_id: appUserId } });
    if (!user) {
      this.logger.warn(`RevenueCat webhook: no user found for app_user_id ${appUserId}`);
      return;
    }

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION': {
        const entitlements = event.entitlement_ids || [];
        if (entitlements.includes('Keepswell Pro')) {
          const updateData: Record<string, any> = {
            subscription_tier: 'pro',
            subscription_status: 'active',
          };
          if (event.expiration_at_ms) {
            updateData.subscription_current_period_end = new Date(event.expiration_at_ms);
          }
          await this.userRepository.update(user.id, updateData);
          this.logger.log(`RevenueCat: User ${user.id} activated Pro`);
        }
        break;
      }

      case 'NON_RENEWING_PURCHASE': {
        // Event pass — one-time purchase
        await this.activateEventPass(user.id);
        this.logger.log(`RevenueCat: User ${user.id} purchased event pass`);
        break;
      }

      case 'CANCELLATION':
      case 'EXPIRATION': {
        await this.userRepository.update(user.id, {
          subscription_tier: 'free',
          subscription_status: 'canceled',
        });
        this.logger.log(`RevenueCat: User ${user.id} downgraded to free`);
        break;
      }

      case 'BILLING_ISSUE': {
        await this.userRepository.update(user.id, {
          subscription_status: 'past_due',
        });
        this.logger.log(`RevenueCat: Billing issue for user ${user.id}`);
        break;
      }

      default:
        this.logger.log(`RevenueCat: Unhandled event type ${eventType}`);
    }
  }

  /**
   * Sync subscription status from RevenueCat after a client-side purchase.
   * The client calls this immediately after a purchase completes so the
   * backend tier updates without waiting for the webhook.
   */
  async syncRevenueCatStatus(clerkId: string): Promise<{ tier: string; status: string }> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fetch customer info from RevenueCat REST API
    const rcApiKey = this.configService.get<string>('REVENUECAT_API_KEY');
    if (!rcApiKey) {
      this.logger.warn('REVENUECAT_API_KEY not configured, skipping sync');
      return { tier: user.subscription_tier, status: user.subscription_status };
    }

    try {
      const response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${clerkId}`,
        {
          headers: {
            Authorization: `Bearer ${rcApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(`RevenueCat API returned ${response.status}`);
        return { tier: user.subscription_tier, status: user.subscription_status };
      }

      const data = await response.json();
      const entitlements = data?.subscriber?.entitlements || {};
      const proEntitlement = entitlements['Keepswell Pro'];

      if (proEntitlement && proEntitlement.expires_date) {
        const expiresAt = new Date(proEntitlement.expires_date);
        if (expiresAt > new Date()) {
          await this.userRepository.update(user.id, {
            subscription_tier: 'pro',
            subscription_status: 'active',
            subscription_current_period_end: expiresAt,
          });
          return { tier: 'pro', status: 'active' };
        }
      }

      // Check for non-expiring entitlements (lifetime or consumable)
      if (proEntitlement && !proEntitlement.expires_date) {
        await this.userRepository.update(user.id, {
          subscription_tier: 'pro',
          subscription_status: 'active',
        });
        return { tier: 'pro', status: 'active' };
      }

      return { tier: user.subscription_tier, status: user.subscription_status };
    } catch (error) {
      this.logger.error(`RevenueCat sync error: ${error}`);
      return { tier: user.subscription_tier, status: user.subscription_status };
    }
  }
}
