import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeedbackTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string; // "note", "commentaire", "choix"

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFeedbackTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
