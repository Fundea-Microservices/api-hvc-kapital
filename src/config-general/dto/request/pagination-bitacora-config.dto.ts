import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from 'src/common';
import { FECHA_REGEX } from 'src/config-general/utils/config-general.util';

export const ACCIONES_BITACORA_CONFIG = [
  'INSERT',
  'UPDATE',
  'SOFT_DELETE',
] as const;

export const ORIGENES_BITACORA_CONFIG = [
  'API',
  'PROCESO_CIERRE',
  'MIGRACION_SEED',
] as const;

export class PaginationBitacoraConfigDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra por el usuario que ejecutó el cambio.',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Campo usuarioId debe ser un UUID válido.' })
  usuarioId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por tipo de acción.',
    enum: ACCIONES_BITACORA_CONFIG,
  })
  @IsOptional()
  @IsIn(ACCIONES_BITACORA_CONFIG, {
    message: 'Campo accion debe ser INSERT, UPDATE o SOFT_DELETE.',
  })
  accion?: (typeof ACCIONES_BITACORA_CONFIG)[number];

  @ApiPropertyOptional({
    description: 'Filtra por canal de origen.',
    enum: ORIGENES_BITACORA_CONFIG,
  })
  @IsOptional()
  @IsIn(ORIGENES_BITACORA_CONFIG, {
    message: 'Campo origen debe ser API, PROCESO_CIERRE o MIGRACION_SEED.',
  })
  origen?: (typeof ORIGENES_BITACORA_CONFIG)[number];

  @ApiPropertyOptional({
    description: 'Desde esta fecha (YYYY-MM-DD), inclusive.',
    example: '2026-11-01',
  })
  @IsOptional()
  @Matches(FECHA_REGEX, {
    message: 'Campo fechaDesde debe tener formato YYYY-MM-DD.',
  })
  @IsDateString({ strict: true }, { message: 'Campo fechaDesde debe ser una fecha válida.' })
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Hasta esta fecha (YYYY-MM-DD), inclusive.',
    example: '2026-11-30',
  })
  @IsOptional()
  @Matches(FECHA_REGEX, {
    message: 'Campo fechaHasta debe tener formato YYYY-MM-DD.',
  })
  @IsDateString({ strict: true }, { message: 'Campo fechaHasta debe ser una fecha válida.' })
  fechaHasta?: string;

  @ApiPropertyOptional({
    description: 'Filtra eventos cuyo arreglo camposModificados contenga este campo.',
    example: 'fechaCierre',
  })
  @IsOptional()
  @IsString({ message: 'Campo campoModificado debe ser una cadena de texto.' })
  @MaxLength(50, { message: 'Campo campoModificado no puede exceder 50 caracteres.' })
  campoModificado?: string;
}
