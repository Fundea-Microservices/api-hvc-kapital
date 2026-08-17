import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationCuentaDto {
  @ApiPropertyOptional({
    description: 'Página que se desea consultar, empezando en 1.',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsPositive({ message: 'Campo page debe ser un número positivo.' })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página.',
    example: 10,
    default: 10,
    minimum: 1,
  })
  @IsPositive({ message: 'Campo limit debe ser un número positivo.' })
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Texto libre para filtrar resultados (coincidencia parcial).',
    example: 'monetaria',
  })
  @IsString({ message: 'Campo busqueda debe ser una cadena de texto.' })
  @IsOptional()
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Si es true, ignora la paginación y devuelve todos los registros.',
    example: false,
  })
  @IsOptional({ message: 'Campo todos debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  todos?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra las cuentas de una empresa concreta.',
    format: 'uuid',
  })
  @IsOptional({ message: 'Campo todos debe ser un identificador UUID.' })
  @IsUUID()
  @Type(() => String)
  empresaId?: string;

  @ApiPropertyOptional({
    description: 'Filtra las cuentas de un banco concreto.',
    format: 'uuid',
  })
  @IsOptional({ message: 'Campo todos debe ser un identificador UUID.' })
  @IsUUID()
  @Type(() => String)
  bancoId?: string;
}
