import { IsOptional, IsString, Matches, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    required: false,
    description: 'Nombre personalizado sin extensión',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'El nombre solo puede contener letras, números, guiones y guiones bajos',
  })
  customName?: string;

  @ApiProperty({ required: false, description: 'Metadatos adicionales' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
