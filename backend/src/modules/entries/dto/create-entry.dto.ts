import { IsString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';

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

/**
 * DTO for creating entries via web upload (free feature)
 * Allows journal owner to add memories without SMS
 */
export class WebEntryDto {
  @IsOptional()
  @IsString()
  participant_id?: string; // Optional - if not provided, entry is from the owner

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media_urls?: string[]; // Cloudinary URLs after client-side upload

  @IsOptional()
  @IsString()
  contributor_name?: string; // Display name for the contributor (if new)
}
