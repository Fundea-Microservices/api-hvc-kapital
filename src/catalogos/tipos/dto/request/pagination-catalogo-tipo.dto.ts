import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationCatalogoTipoDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra catálogos activos (true) o inactivos (false).',
    example: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra catálogos que permiten jerarquía.',
    example: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo permiteJerarquia debe ser un valor booleano.' })
  @IsOptional()
  permiteJerarquia?: boolean;
}
