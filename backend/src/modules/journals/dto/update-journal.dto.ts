import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateJournalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'paused', 'archived'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['daily', 'weekly', 'biweekly', 'monthly'])
  prompt_frequency?: string;

  @IsOptional()
  prompt_day_of_week?: number;

  @IsString()
  @IsOptional()
  prompt_time?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  cover_image_url?: string;
}
