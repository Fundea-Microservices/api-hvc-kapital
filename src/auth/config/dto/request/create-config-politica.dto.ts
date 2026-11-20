import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';
import { toCodigoConfig } from './create-config-modulo.dto';

/** El código es la clave natural de negocio: mayúsculas, dígitos y guion bajo. */
export const CONFIG_POLITICA_CODIGO_REGEX = /^[A-Z0-9_]+$/;

export class CreateConfigPoliticaDto {
  @ApiProperty({
    description: 'UUID del módulo al que pertenece la política.',
    example: 'a1b2c3d4-e5f6-4789-9012-3456789abcde',
  })
  @IsUUID(undefined, { message: 'Campo moduloId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'Campo moduloId es obligatorio.' })
  moduloId!: string;

  @ApiProperty({
    description: 'Código único e inmutable de la política (clave de negocio).',
    example: 'POL_TASAS_COMISIONES',
    maxLength: 50,
  })
  @Transform(toCodigoConfig)
  @IsString({ message: 'Campo codigo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo codigo es obligatorio.' })
  @MaxLength(50, { message: 'Campo codigo no puede exceder 50 caracteres.' })
  @Matches(CONFIG_POLITICA_CODIGO_REGEX, {
    message: 'Campo codigo solo admite mayúsculas, dígitos y guion bajo.',
  })
  codigo!: string;

  @ApiProperty({
    description: 'Nombre visible de la política.',
    example: 'Tasas y Comisiones',
    maxLength: 100,
  })
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo nombre es obligatorio.' })
  @MaxLength(100, { message: 'Campo nombre no puede exceder 100 caracteres.' })
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Descripción de la política.',
    example: 'Tasas de interés, comisiones y cargos aplicables.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @MaxLength(255, {
    message: 'Campo descripcion no puede exceder 255 caracteres.',
  })
  descripcion?: string;

  @ApiPropertyOptional({
    description:
      'Orden de despliegue dentro de su módulo. Debe estar libre; si se omite, se asigna al final.',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Campo orden debe ser un número entero.' })
  @Min(0, { message: 'Campo orden no puede ser negativo.' })
  orden?: number;

  @ApiPropertyOptional({
    description: 'Indica si la política está vigente.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @Transform(toBoolean)
  activo?: boolean;
}
