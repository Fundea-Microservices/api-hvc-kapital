import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';

export class PaginationConfigDto extends PaginationActiveDto {
  @ApiPropertyOptional({
    description:
      'Filtra los parámetros por módulo (atraviesa `politica.moduloId`).',
    example: 'a1b2c3d4-e5f6-4789-9012-3456789abcde',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Campo moduloId debe ser un UUID válido.' })
  moduloId?: string;

  @ApiPropertyOptional({
    description: 'Filtra los parámetros por política.',
    example: 'b7e2f8a1-4c3d-4e9b-8a12-9f0c1d2e3f4a',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Campo politicaId debe ser un UUID válido.' })
  politicaId?: string;
}
