import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMetadataDto {
  @ApiPropertyOptional({
    description:
      'Se acepta por compatibilidad con la app, pero se IGNORA: el equipo se ' +
      'identifica con la cabecera x-device-token.',
    example: '6f9619ff-8b86-d011-b42d-00c04fc964ff',
  })
  @IsOptional()
  @IsString()
  deviceToken?: string;

  @ApiProperty({ description: 'Modelo del equipo.', example: 'Pixel 7a' })
  @IsString()
  @MinLength(1, { message: 'El modelo del equipo es requerido.' })
  @MaxLength(100)
  modelo!: string;

  @ApiProperty({
    description: 'Sistema operativo y version.',
    example: 'android 15',
  })
  @IsString()
  @MinLength(1, { message: 'La version de SO es requerida.' })
  @MaxLength(50)
  versionSO!: string;
}
