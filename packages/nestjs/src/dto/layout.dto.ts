import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLayoutDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  alias!: string;

  @IsString()
  @IsOptional()
  htmlBody?: string;

  @IsString()
  @IsOptional()
  textBody?: string;
}

export class UpdateLayoutDto extends CreateLayoutDto {}
