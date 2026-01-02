import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clerkId = request.user?.clerkId;

    if (!clerkId) {
      throw new ForbiddenException('Not authenticated');
    }

    const user = await this.userRepo.findOne({
      where: { clerk_id: clerkId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isPremium =
      user.subscription_tier === 'premium' && user.subscription_status === 'active';

    if (!isPremium) {
      throw new ForbiddenException(
        'Premium subscription required. Please upgrade to access this feature.',
      );
    }

    return true;
  }
}
