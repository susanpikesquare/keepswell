import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Journal, Participant } from '../../database/entities';

// Tier limits constants
export const TIER_LIMITS = {
  free: {
    maxJournals: 1,
    maxContributorsPerJournal: 3,
    smsEnabled: false,
    customPrompts: false,
  },
  pro: {
    maxJournals: Infinity,
    maxContributorsPerJournal: 15,
    smsEnabled: true,
    customPrompts: true,
  },
  event: {
    maxJournals: 1, // The event journal only
    maxContributorsPerJournal: 15,
    smsEnabled: true,
    customPrompts: true,
  },
};

// Pricing constants (in USD)
export const PRICING = {
  pro: {
    monthly: 4.99,
    yearly: 44.99,
    trialDays: 7,
  },
  event: {
    oneTime: 24.99,
    durationDays: 90,
  },
  addOns: {
    participantBundle: {
      price: 4.99,
      slots: 5,
    },
  },
};

export interface TierLimits {
  maxJournals: number;
  maxContributorsPerJournal: number;
  smsEnabled: boolean;
  customPrompts: boolean;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}

export interface UsageLimits {
  journalCount: number;
  maxJournals: number; // -1 = unlimited
  canCreateJournal: boolean;
  tier: string;
  isPro: boolean;
  smsEnabled: boolean;
  customPrompts: boolean;
  maxContributorsPerJournal: number;
  extraParticipantSlots: number;
  eventPassExpiresAt: string | null;
  trialEndsAt: string | null;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  /**
   * Check if user has an active Pro subscription
   */
  isPro(user: User): boolean {
    return (
      user.subscription_tier === 'pro' &&
      user.subscription_status === 'active'
    );
  }

  /**
   * Check if user has any active paid subscription (pro or legacy premium)
   */
  isPaid(user: User): boolean {
    return (
      ['pro', 'premium'].includes(user.subscription_tier) &&
      user.subscription_status === 'active'
    );
  }

  /**
   * Check if user has an active event pass
   */
  hasActiveEventPass(user: User): boolean {
    return (
      user.subscription_tier === 'event' &&
      user.event_pass_expires_at != null &&
      new Date(user.event_pass_expires_at) > new Date()
    );
  }

  /**
   * Check if user is in a free trial period
   */
  isInTrial(user: User): boolean {
    return (
      user.subscription_status === 'trialing' &&
      user.subscription_current_period_end != null &&
      new Date(user.subscription_current_period_end) > new Date()
    );
  }

  /**
   * Check if user has SMS access (pro, active event pass, or trial)
   */
  hasSmsAccess(user: User): boolean {
    return this.isPaid(user) || this.hasActiveEventPass(user) || this.isInTrial(user);
  }

  /**
   * Get tier limits for a user
   */
  getTierLimits(user: User): TierLimits {
    if (this.isPaid(user) || this.isInTrial(user)) {
      return TIER_LIMITS.pro;
    }
    if (this.hasActiveEventPass(user)) {
      return TIER_LIMITS.event;
    }
    return TIER_LIMITS.free;
  }

  /**
   * Get the count of journals owned by a user
   */
  async getUserJournalCount(userId: string): Promise<number> {
    return this.journalRepository.count({ where: { owner_id: userId } });
  }

  /**
   * Get the count of contributors in a journal
   */
  async getJournalContributorCount(journalId: string): Promise<number> {
    return this.participantRepository.count({ where: { journal_id: journalId } });
  }

  /**
   * Get the effective max contributors for a journal, including add-on slots
   */
  getEffectiveMaxContributors(user: User): number {
    const limits = this.getTierLimits(user);
    return limits.maxContributorsPerJournal + (user.extra_participant_slots || 0);
  }

  /**
   * Check if a user can create another journal
   */
  async canCreateJournal(user: User): Promise<LimitCheckResult> {
    const limits = this.getTierLimits(user);

    // Pro users can create unlimited journals
    if (limits.maxJournals === Infinity) {
      return { allowed: true };
    }

    const journalCount = await this.getUserJournalCount(user.id);

    if (journalCount >= limits.maxJournals) {
      return {
        allowed: false,
        reason: `Free accounts are limited to ${limits.maxJournals} journal. Upgrade to Pro for unlimited journals.`,
        current: journalCount,
        limit: limits.maxJournals,
      };
    }

    return {
      allowed: true,
      current: journalCount,
      limit: limits.maxJournals,
    };
  }

  /**
   * Check if a user can add another contributor to a journal
   */
  async canAddContributor(user: User, journalId: string): Promise<LimitCheckResult> {
    const effectiveMax = this.getEffectiveMaxContributors(user);
    const contributorCount = await this.getJournalContributorCount(journalId);

    if (contributorCount >= effectiveMax) {
      const isPaid = this.isPaid(user) || this.hasActiveEventPass(user) || this.isInTrial(user);
      const tierName = isPaid ? 'your current plan' : 'Free accounts';
      return {
        allowed: false,
        reason: `${tierName} ${isPaid ? 'is' : 'are'} limited to ${effectiveMax} contributors per journal.${
          !isPaid ? ' Upgrade to Pro for up to 15 contributors.' : ' Purchase additional participant slots for more.'
        }`,
        current: contributorCount,
        limit: effectiveMax,
      };
    }

    return {
      allowed: true,
      current: contributorCount,
      limit: effectiveMax,
    };
  }

  /**
   * Check if user's tier allows SMS messaging
   */
  canUseSms(user: User): LimitCheckResult {
    if (!this.hasSmsAccess(user)) {
      return {
        allowed: false,
        reason: 'SMS messaging is a Pro feature. Upgrade to Pro or start a free trial to send SMS prompts.',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can use custom prompts
   */
  canUseCustomPrompts(user: User): LimitCheckResult {
    const limits = this.getTierLimits(user);

    if (!limits.customPrompts) {
      return {
        allowed: false,
        reason: 'Custom prompts are a Pro feature. Upgrade to Pro to create your own prompts.',
      };
    }

    return { allowed: true };
  }

  /**
   * Get usage limits and current usage for a user
   */
  async getUsageLimits(userId: string): Promise<UsageLimits> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const limits = this.getTierLimits(user);
    const journalCount = await this.getUserJournalCount(userId);
    const isPro = this.isPaid(user);

    return {
      journalCount,
      maxJournals: limits.maxJournals === Infinity ? -1 : limits.maxJournals,
      canCreateJournal: journalCount < limits.maxJournals,
      tier: user.subscription_tier,
      isPro,
      smsEnabled: this.hasSmsAccess(user),
      customPrompts: limits.customPrompts,
      maxContributorsPerJournal: this.getEffectiveMaxContributors(user),
      extraParticipantSlots: user.extra_participant_slots || 0,
      eventPassExpiresAt: user.event_pass_expires_at
        ? new Date(user.event_pass_expires_at).toISOString()
        : null,
      trialEndsAt: (this.isInTrial(user) && user.subscription_current_period_end)
        ? new Date(user.subscription_current_period_end).toISOString()
        : null,
    };
  }

  /**
   * Get usage limits by clerk ID
   */
  async getUsageLimitsByClerkId(clerkId: string): Promise<UsageLimits> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new Error('User not found');
    }

    return this.getUsageLimits(user.id);
  }
}
