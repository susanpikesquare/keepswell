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
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clerkId = request.user?.id;

    if (!clerkId) {
      throw new ForbiddenException('Not authenticated');
    }

    const user = await this.userRepo.findOne({
      where: { clerk_id: clerkId },
    });

    if (!user || !user.is_admin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
