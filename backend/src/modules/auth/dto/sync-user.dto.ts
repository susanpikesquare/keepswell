import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SyncUserDto {
  @IsString()
  clerk_id: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  phone_number?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;
}
