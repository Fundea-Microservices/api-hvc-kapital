import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common';
import { toBoolean } from 'src/common/transformers/boolean.transformer';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

export class PaginationCatalogoItemDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra los ítems de un catálogo específico.',
    format: 'uuid',
  })
  @IsGuid({ message: 'Campo catalogoTipoId debe ser un UUID válido.' })
  @IsOptional()
  catalogoTipoId?: string;

  @ApiPropertyOptional({
    description:
      'Filtra los ítems hijos directos de un padre. Use un UUID para obtener los hijos de ese ítem.',
    format: 'uuid',
  })
  @IsGuid({ message: 'Campo padreId debe ser un UUID válido.' })
  @IsOptional()
  padreId?: string;

  @ApiPropertyOptional({
    description: 'Filtra ítems activos (true) o inactivos (false).',
    example: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
