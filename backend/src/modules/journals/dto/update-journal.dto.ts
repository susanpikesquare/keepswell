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
  // 'none' = prompts paused. Scheduler treats it as never-send (default
  // branch in shouldSendToday) and seedUpcomingScheduledPrompts skips.
  @IsIn(['daily', 'weekly', 'biweekly', 'monthly', 'none'])
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
