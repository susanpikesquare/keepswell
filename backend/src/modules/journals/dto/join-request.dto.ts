import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class JoinRequestDto {
  @IsString()
  phone_number: string;

  @IsString()
  @IsOptional()
  display_name?: string;

  @IsString()
  @IsOptional()
  relationship?: string;
}
