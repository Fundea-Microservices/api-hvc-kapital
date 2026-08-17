import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class CreateApikeyDto {
  @ApiProperty({
    description: 'Nombre corto que identifica la llave.',
    example: 'Integración ERP',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo nombre debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'Campo nombre no puede exceder 50 caracteres.' })
  nombre!: string;

  @ApiProperty({
    description: 'Para qué se usa la llave y quién la consume.',
    example: 'Llave usada por el ERP para sincronizar catálogos cada noche.',
    minLength: 3,
    maxLength: 250,
  })
  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @MinLength(3, {
    message: 'Campo descripcion debe tener al menos 3 caracteres.',
  })
  @MaxLength(250, {
    message: 'Campo descripcion no puede exceder 250 caracteres.',
  })
  descripcion!: string;

  @ApiProperty({
    description:
      'Valor de la llave: cadena hexadecimal de exactamente 64 caracteres (256 bits).',
    example:
      'aa8f9415004e3d7033d37a16e2ddcf0894f4b5d9c0ff3b0a77b9398aa572149c',
    pattern: '^[0-9a-fA-F]{64}$',
    minLength: 64,
    maxLength: 64,
  })
  @IsString({ message: 'Campo valor debe ser una cadena de texto.' })
  @Matches(/^[0-9a-fA-F]{64}$/, {
    message:
      'Campo valor debe ser una cadena hexadecimal de exactamente 64 caracteres.',
  })
  valor!: string;

  @ApiPropertyOptional({
    description: 'Indica si la llave puede usarse. Una llave inactiva es rechazada.',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
