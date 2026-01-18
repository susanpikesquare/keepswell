import { IsString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ALLOWED_REACTIONS } from '../../../database/entities';

export class CreateReactionDto {
  @IsString()
  @IsIn(ALLOWED_REACTIONS as unknown as string[])
  emoji: string;

  @IsOptional()
  @IsUUID()
  participant_id?: string;
}
