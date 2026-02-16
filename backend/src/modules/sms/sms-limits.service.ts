import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';

export interface SmsLimitCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface SmsUsageStats {
  tier: string;
  isPro: boolean;
  smsEnabled: boolean;
}

@Injectable()
export class SmsLimitsService {
  private readonly logger = new Logger(SmsLimitsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Check if a user has SMS access (Pro, active event pass, or trial)
   */
  private hasSmsAccess(user: User): boolean {
    // Pro or legacy premium with active status
    if (
      ['premium', 'pro'].includes(user.subscription_tier) &&
      ['active', 'trialing'].includes(user.subscription_status)
    ) {
      return true;
    }
    // Active event pass
    if (
      user.subscription_tier === 'event' &&
      user.event_pass_expires_at != null &&
      new Date(user.event_pass_expires_at) > new Date()
    ) {
      return true;
    }
    return false;
  }

  /**
   * Check if a user can send any SMS (invites or prompts)
   * Free tier: NO SMS at all
   * Pro tier: Unlimited SMS
   */
  async canSendSms(userId: string): Promise<SmsLimitCheckResult> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    if (!this.hasSmsAccess(user)) {
      return {
        allowed: false,
        reason: 'SMS messaging is a Pro feature. Upgrade to Pro to send SMS prompts to contributors.',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if a user can send an invite SMS
   * Alias for canSendSms - same tier-based gating
   */
  async canSendInvite(userId: string): Promise<SmsLimitCheckResult> {
    return this.canSendSms(userId);
  }

  /**
   * Record an SMS being sent (for analytics only - no limits enforced)
   */
  async recordSmsSent(userId: string): Promise<void> {
    this.logger.log(`SMS sent for user ${userId}`);
    // Keeping for analytics - increment counter
    await this.userRepository.increment(
      { id: userId },
      'sms_sends_this_month',
      1,
    );
  }

  /**
   * Record an invite SMS being sent (for analytics only - no limits enforced)
   */
  async recordInviteSent(userId: string): Promise<void> {
    this.logger.log(`Invite SMS sent for user ${userId}`);
    // Keeping for analytics - increment counter
    await this.userRepository.increment(
      { id: userId },
      'sms_invites_total',
      1,
    );
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(userId: string): Promise<SmsUsageStats> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isPro = this.hasSmsAccess(user);

    return {
      tier: user.subscription_tier,
      isPro,
      smsEnabled: isPro,
    };
  }
}
