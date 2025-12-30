import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';
import { SyncUserDto } from './dto/sync-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async syncUser(syncUserDto: SyncUserDto): Promise<User> {
    const { clerk_id, email, full_name, phone_number, avatar_url } = syncUserDto;

    // Check if user exists
    let user = await this.userRepository.findOne({ where: { clerk_id } });

    if (user) {
      // Update existing user
      user.email = email;
      if (full_name) user.full_name = full_name;
      if (phone_number) user.phone_number = phone_number;
      if (avatar_url) user.avatar_url = avatar_url;

      user = await this.userRepository.save(user);
      this.logger.log(`Updated user ${user.id} from Clerk`);
    } else {
      // Create new user
      user = this.userRepository.create({
        clerk_id,
        email,
        full_name,
        phone_number,
        avatar_url,
      });

      user = await this.userRepository.save(user);
      this.logger.log(`Created new user ${user.id} from Clerk`);
    }

    return user;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { clerk_id: clerkId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
