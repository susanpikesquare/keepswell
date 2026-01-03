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
  },
  pro: {
    maxJournals: Infinity,
    maxContributorsPerJournal: 15,
    smsEnabled: true,
  },
};

export interface TierLimits {
  maxJournals: number;
  maxContributorsPerJournal: number;
  smsEnabled: boolean;
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
   * Get tier limits for a user
   */
  getTierLimits(user: User): TierLimits {
    return this.isPaid(user) ? TIER_LIMITS.pro : TIER_LIMITS.free;
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
    const limits = this.getTierLimits(user);
    const contributorCount = await this.getJournalContributorCount(journalId);

    if (contributorCount >= limits.maxContributorsPerJournal) {
      const tierName = this.isPaid(user) ? 'Pro' : 'Free';
      return {
        allowed: false,
        reason: `${tierName} accounts are limited to ${limits.maxContributorsPerJournal} contributors per journal.${
          !this.isPaid(user) ? ' Upgrade to Pro for up to 15 contributors.' : ''
        }`,
        current: contributorCount,
        limit: limits.maxContributorsPerJournal,
      };
    }

    return {
      allowed: true,
      current: contributorCount,
      limit: limits.maxContributorsPerJournal,
    };
  }

  /**
   * Check if user's tier allows SMS messaging
   */
  canUseSms(user: User): LimitCheckResult {
    const limits = this.getTierLimits(user);

    if (!limits.smsEnabled) {
      return {
        allowed: false,
        reason: 'SMS messaging is a Pro feature. Upgrade to Pro to send SMS prompts to contributors.',
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
      smsEnabled: limits.smsEnabled,
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
