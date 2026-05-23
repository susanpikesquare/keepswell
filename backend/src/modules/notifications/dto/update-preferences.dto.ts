import { IsBoolean, IsOptional } from 'class-validator';

/** Partial update — only fields provided are changed. */
export class UpdateNotificationPreferencesDto {
  @IsOptional() @IsBoolean() notify_entries?: boolean;
  @IsOptional() @IsBoolean() notify_comments?: boolean;
  @IsOptional() @IsBoolean() notify_reactions?: boolean;
  @IsOptional() @IsBoolean() notify_joins?: boolean;
}
