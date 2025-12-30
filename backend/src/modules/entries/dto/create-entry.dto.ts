import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['text', 'photo', 'mixed'])
  entry_type?: 'text' | 'photo' | 'mixed';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media_urls?: string[];
}

export class SimulateEntryDto {
  @IsString()
  participant_id: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['text', 'photo', 'mixed'])
  entry_type?: 'text' | 'photo' | 'mixed';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media_urls?: string[];
}
