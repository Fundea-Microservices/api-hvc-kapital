import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from 'src/common';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationCarouselDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra por elementos activos o inactivos.',
    example: true,
  })
  @IsOptional({ message: 'Campo activo debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra por elementos visibles (o no) en la web.',
    example: true,
  })
  @IsOptional({ message: 'Campo visibleWeb debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  visibleWeb?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra por elementos visibles (o no) en la app.',
    example: true,
  })
  @IsOptional({ message: 'Campo visibleApp debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  visibleApp?: boolean;

  @ApiPropertyOptional({
    description:
      'Si es true, solo devuelve los elementos vigentes hoy (fechaInicio <= ahora <= fechaFin, tomando null como sin límite).',
    example: false,
  })
  @IsOptional({ message: 'Campo vigente debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  vigente?: boolean;

  @ApiPropertyOptional({
    description:
      'Solo los elementos cuya lista `usuarios` incluye este código (coincidencia exacta).',
    example: 'jperez',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString({ message: 'Campo usuario debe ser una cadena de texto.' })
  @MaxLength(100, { message: 'Campo usuario no puede exceder 100 caracteres.' })
  @Matches(/^[^,\s]+$/, {
    message: 'Campo usuario no puede contener comas ni espacios.',
  })
  @IsOptional()
  usuario?: string;

  @ApiPropertyOptional({
    description:
      'Solo los elementos cuya lista `tiposUsuario` incluye este código (coincidencia exacta).',
    example: 'INVERSOR',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() || undefined : value,
  )
  @IsString({ message: 'Campo tipoUsuario debe ser una cadena de texto.' })
  @MaxLength(50, {
    message: 'Campo tipoUsuario no puede exceder 50 caracteres.',
  })
  @Matches(/^[^,\s]+$/, {
    message: 'Campo tipoUsuario no puede contener comas ni espacios.',
  })
  @IsOptional()
  tipoUsuario?: string;
}
