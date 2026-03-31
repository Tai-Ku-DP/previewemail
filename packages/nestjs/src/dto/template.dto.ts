import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  alias!: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  htmlBody?: string;

  @IsString()
  @IsOptional()
  textBody?: string;

  @IsObject()
  @IsOptional()
  mockData?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  layoutId?: string;
}

export class UpdateTemplateDto extends CreateTemplateDto {}
