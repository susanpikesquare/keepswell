import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Journal, Entry, Participant } from '../../database/entities';

export interface PlatformStats {
  users: {
    total: number;
    thisMonth: number;
    byTier: { tier: string; count: number }[];
  };
  journals: {
    total: number;
    active: number;
    byTemplate: { template: string; count: number }[];
  };
  entries: {
    total: number;
    thisMonth: number;
    withMedia: number;
  };
  participants: {
    total: number;
    active: number;
  };
  projectedCosts: {
    smsMessages: number;
    smsCost: number;
    storageMB: number;
    storageCost: number;
    hostingCost: number;
    totalMonthly: number;
  };
}

export interface UserDetails {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  is_admin: boolean;
  created_at: Date;
  journalCount: number;
  entryCount: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Journal)
    private journalRepo: Repository<Journal>,
    @InjectRepository(Entry)
    private entryRepo: Repository<Entry>,
    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
  ) {}

  async getPlatformStats(): Promise<PlatformStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User stats
    const totalUsers = await this.userRepo.count();
    const usersThisMonth = await this.userRepo
      .createQueryBuilder('user')
      .where('user.created_at >= :startOfMonth', { startOfMonth })
      .getCount();

    const usersByTier = await this.userRepo
      .createQueryBuilder('user')
      .select('user.subscription_tier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.subscription_tier')
      .getRawMany();

    // Journal stats
    const totalJournals = await this.journalRepo.count();
    const activeJournals = await this.journalRepo.count({
      where: { status: 'active' },
    });

    const journalsByTemplate = await this.journalRepo
      .createQueryBuilder('journal')
      .select('journal.template_type', 'template')
      .addSelect('COUNT(*)', 'count')
      .groupBy('journal.template_type')
      .getRawMany();

    // Entry stats
    const totalEntries = await this.entryRepo.count();
    const entriesThisMonth = await this.entryRepo
      .createQueryBuilder('entry')
      .where('entry.created_at >= :startOfMonth', { startOfMonth })
      .getCount();

    const entriesWithMedia = await this.entryRepo
      .createQueryBuilder('entry')
      .where("entry.entry_type IN ('photo', 'mixed')")
      .getCount();

    // Participant stats
    const totalParticipants = await this.participantRepo.count();
    const activeParticipants = await this.participantRepo.count({
      where: { status: 'active' },
    });

    // Calculate projected costs
    // Vonage SMS: ~$0.0075 per message (US)
    // Cloudinary: ~$0.01 per MB after free tier
    // Render: Free tier for now, $7/mo per service on Starter
    const estimatedMessagesPerMonth = activeParticipants * 4; // 4 prompts per month average
    const smsCost = estimatedMessagesPerMonth * 0.0075 * 2; // Send + receive

    const estimatedStorageMB = entriesWithMedia * 0.5; // ~500KB per image
    const storageCost = Math.max(0, (estimatedStorageMB - 25000) * 0.01); // 25GB free

    const hostingCost = 0; // Free tier, would be $7 * 2 services = $14 on Starter

    return {
      users: {
        total: totalUsers,
        thisMonth: usersThisMonth,
        byTier: usersByTier.map((r) => ({
          tier: r.tier,
          count: parseInt(r.count),
        })),
      },
      journals: {
        total: totalJournals,
        active: activeJournals,
        byTemplate: journalsByTemplate.map((r) => ({
          template: r.template,
          count: parseInt(r.count),
        })),
      },
      entries: {
        total: totalEntries,
        thisMonth: entriesThisMonth,
        withMedia: entriesWithMedia,
      },
      participants: {
        total: totalParticipants,
        active: activeParticipants,
      },
      projectedCosts: {
        smsMessages: estimatedMessagesPerMonth,
        smsCost: Math.round(smsCost * 100) / 100,
        storageMB: Math.round(estimatedStorageMB),
        storageCost: Math.round(storageCost * 100) / 100,
        hostingCost,
        totalMonthly: Math.round((smsCost + storageCost + hostingCost) * 100) / 100,
      },
    };
  }

  async getAllUsers(): Promise<UserDetails[]> {
    const users = await this.userRepo.find({
      order: { created_at: 'DESC' },
    });

    const userDetails: UserDetails[] = [];

    for (const user of users) {
      const journalCount = await this.journalRepo.count({
        where: { owner_id: user.id },
      });

      const entryCount = await this.entryRepo
        .createQueryBuilder('entry')
        .innerJoin('entry.journal', 'journal')
        .where('journal.owner_id = :userId', { userId: user.id })
        .getCount();

      userDetails.push({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        subscription_tier: user.subscription_tier,
        is_admin: user.is_admin,
        created_at: user.created_at,
        journalCount,
        entryCount,
      });
    }

    return userDetails;
  }

  async setAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    await this.userRepo.update(userId, { is_admin: isAdmin });
    return this.userRepo.findOneOrFail({ where: { id: userId } });
  }

  async setSubscriptionTier(
    userId: string,
    tier: 'free' | 'premium' | 'pro',
  ): Promise<User> {
    this.logger.log(`Admin setting user ${userId} to tier: ${tier}`);
    await this.userRepo.update(userId, {
      subscription_tier: tier,
      subscription_status: tier === 'free' ? 'active' : 'active',
    });
    return this.userRepo.findOneOrFail({ where: { id: userId } });
  }

  async makeUserAdminByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      return null;
    }
    await this.userRepo.update(user.id, { is_admin: true });
    return this.userRepo.findOneOrFail({ where: { id: user.id } });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async setTierByEmail(
    email: string,
    tier: 'free' | 'premium' | 'pro',
  ): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      return null;
    }
    this.logger.log(`Setting user ${email} to tier: ${tier}`);
    await this.userRepo.update(user.id, {
      subscription_tier: tier,
      subscription_status: 'active',
    });
    return this.userRepo.findOneOrFail({ where: { id: user.id } });
  }
}
