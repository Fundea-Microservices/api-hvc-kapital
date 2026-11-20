import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';

export class PaginationConfigPoliticaDto extends PaginationActiveDto {
  @ApiPropertyOptional({
    description:
      'Filtra las políticas por módulo. Útil para el combo dependiente de la UI.',
    example: 'a1b2c3d4-e5f6-4789-9012-3456789abcde',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Campo moduloId debe ser un UUID válido.' })
  moduloId?: string;
}
