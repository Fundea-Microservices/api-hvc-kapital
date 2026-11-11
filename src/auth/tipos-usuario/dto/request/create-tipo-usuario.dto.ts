import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

/**
 * El código se guarda en listas separadas por coma (config.Carousel.tiposUsuario),
 * por eso no admite comas ni espacios. Se normaliza a mayúsculas.
 */
export const TIPO_USUARIO_CODIGO_REGEX = /^[A-Z0-9_-]+$/;

export const toCodigoTipoUsuario = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateTipoUsuarioDto {
  @ApiProperty({
    description:
      'Código único del tipo de usuario. Se guarda en mayúsculas; solo letras, números, guion y guion bajo.',
    example: 'INVERSOR',
    maxLength: 50,
  })
  @Transform(toCodigoTipoUsuario)
  @IsString({ message: 'Campo codigo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo codigo es obligatorio.' })
  @MaxLength(50, { message: 'Campo codigo no puede exceder 50 caracteres.' })
  @Matches(TIPO_USUARIO_CODIGO_REGEX, {
    message:
      'Campo codigo solo admite letras, números, guion (-) y guion bajo (_), sin espacios ni comas.',
  })
  codigo!: string;

  @ApiProperty({
    description: 'Nombre para mostrar del tipo de usuario.',
    example: 'Inversor',
    maxLength: 100,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo nombre es obligatorio.' })
  @MaxLength(100, { message: 'Campo nombre no puede exceder 100 caracteres.' })
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Descripción del tipo de usuario.',
    example: 'Clientes que invierten en productos de HVC Kapital',
    maxLength: 500,
    nullable: true,
  })
  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @MaxLength(500, {
    message: 'Campo descripcion no puede exceder 500 caracteres.',
  })
  @IsOptional()
  descripcion?: string | null;

  @ApiPropertyOptional({
    description: 'Indica si el tipo de usuario está activo.',
    example: true,
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
