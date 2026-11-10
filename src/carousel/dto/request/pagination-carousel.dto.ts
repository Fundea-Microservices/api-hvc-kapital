import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
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
}
