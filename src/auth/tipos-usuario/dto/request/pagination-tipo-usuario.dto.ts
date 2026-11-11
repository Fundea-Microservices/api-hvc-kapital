import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common';

export enum EstadoTipoUsuarioFiltro {
  TODOS = 'todos',
  ACTIVOS = 'activos',
  INACTIVOS = 'inactivos',
}

export class PaginationTipoUsuarioDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Filtra por estado: `todos` (por defecto), `activos` (activo = true) o `inactivos` (activo = false).',
    enum: EstadoTipoUsuarioFiltro,
    example: EstadoTipoUsuarioFiltro.ACTIVOS,
    default: EstadoTipoUsuarioFiltro.TODOS,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEnum(EstadoTipoUsuarioFiltro, {
    message: 'Campo estado debe ser uno de: todos, activos, inactivos.',
  })
  @IsOptional()
  estado: EstadoTipoUsuarioFiltro = EstadoTipoUsuarioFiltro.TODOS;
}
