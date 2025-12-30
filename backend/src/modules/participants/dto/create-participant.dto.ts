import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateParticipantDto {
  @IsString()
  phone_number: string;

  @IsString()
  display_name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  relationship?: string;
}
