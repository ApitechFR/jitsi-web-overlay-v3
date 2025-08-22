import { IsNotEmpty, IsOptional, IsString, IsInt, IsArray } from 'class-validator';

export class CreateFeedbackTemplateDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsInt()
  @IsNotEmpty()
  typeId: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  choices?: string[]; // seulement utilisé si type = "choix"

  @IsOptional()
  @IsString()
  organization?: string;
}

export class UpdateFeedbackTemplateDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsInt()
  typeId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  choices?: string[];

  @IsOptional()
  @IsString()
  organization?: string;
}
