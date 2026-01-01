import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateJournalDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['family', 'friends', 'romantic', 'vacation', 'custom'])
  template_type: string;

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
  owner_phone?: string;

  @IsBoolean()
  @IsOptional()
  owner_participate?: boolean;
}
