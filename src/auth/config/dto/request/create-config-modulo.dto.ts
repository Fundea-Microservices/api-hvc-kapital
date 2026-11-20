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

/** El código es la clave natural de negocio: mayúsculas, dígitos y guion bajo. */
export const CONFIG_MODULO_CODIGO_REGEX = /^[A-Z0-9_]+$/;

export const toCodigoConfig = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateConfigModuloDto {
  @ApiProperty({
    description: 'Código único e inmutable del módulo (clave de negocio).',
    example: 'MOD_CREDITOS',
    maxLength: 50,
  })
  @Transform(toCodigoConfig)
  @IsString({ message: 'Campo codigo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo codigo es obligatorio.' })
  @MaxLength(50, { message: 'Campo codigo no puede exceder 50 caracteres.' })
  @Matches(CONFIG_MODULO_CODIGO_REGEX, {
    message: 'Campo codigo solo admite mayúsculas, dígitos y guion bajo.',
  })
  codigo!: string;

  @ApiProperty({
    description: 'Nombre visible del módulo.',
    example: 'Créditos',
    maxLength: 100,
  })
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo nombre es obligatorio.' })
  @MaxLength(100, { message: 'Campo nombre no puede exceder 100 caracteres.' })
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Descripción funcional del módulo.',
    example: 'Parámetros de originación, tasas y comisiones.',
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
      'Orden de despliegue en selectores y listas. Debe estar libre; si se omite, se asigna al final.',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Campo orden debe ser un número entero.' })
  @Min(0, { message: 'Campo orden no puede ser negativo.' })
  orden?: number;

  @ApiPropertyOptional({
    description:
      'UUID del menú al que se vinculará el módulo. Reservado: todavía no se valida contra `Menu`.',
    example: 'a1b2c3d4-e5f6-4789-9012-3456789abcde',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Campo menuId debe ser un UUID válido.' })
  menuId?: string;

  @ApiPropertyOptional({
    description: 'Indica si el módulo está vigente.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @Transform(toBoolean)
  activo?: boolean;
}
