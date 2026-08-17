import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const TIPOS = ['string', 'number', 'boolean', 'array', 'object'] as const;
export type TipoConfig = (typeof TIPOS)[number];

export class CreateConfigDto {
  @ApiProperty({
    description: 'Identificador único del parámetro de configuración.',
    example: 'DIAS_VENCIMIENTO_CLAVE',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'Campo llave debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo llave debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'Campo llave no puede exceder 50 caracteres.' })
  llave!: string;

  @ApiProperty({
    description:
      'Valor del parámetro, siempre como texto. Se interpreta según el campo tipo.',
    example: '90',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString({ message: 'Campo valor debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo valor debe tener al menos 1 caracter.' })
  @MaxLength(1000, { message: 'Campo valor no puede exceder 1000 caracteres.' })
  valor!: string;

  @ApiProperty({
    description: 'Tipo al que debe convertirse el valor al leerlo.',
    enum: TIPOS,
    example: 'number',
  })
  @IsString({ message: 'Campo tipo debe ser una cadena de texto.' })
  @IsIn(TIPOS as unknown as string[], {
    message: 'Campo tipo inválido. Use: string|number|boolean|array|object.',
  })
  tipo!: TipoConfig | string;

  @ApiPropertyOptional({
    description: 'Explica para qué sirve el parámetro.',
    example: 'Días que transcurren antes de exigir cambio de contraseña.',
    maxLength: 300,
  })
  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @IsOptional()
  @MaxLength(300, {
    message: 'Campo descripcion no puede exceder 300 caracteres.',
  })
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Indica si el parámetro está vigente.',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
