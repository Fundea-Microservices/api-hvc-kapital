import { IsString, IsOptional, IsUUID, IsNumber, Min, IsDate, IsIn } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class CreateInsumoDto {
  @ApiPropertyOptional({ description: 'UUID de la categoría a la que pertenece el insumo', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('all', { message: 'La categoría debe ser un UUID válido' })
  @IsOptional()
  categoria_id?: string;

  @ApiProperty({ description: 'Código único del insumo', example: 'INS-001' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  codigo!: string;

  @ApiProperty({ description: 'Nombre del insumo', example: 'Aceite de cocina' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre!: string;

  @ApiPropertyOptional({ description: 'Descripción detallada del insumo', example: 'Aceite vegetal para uso en cocina' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Unidad de medida del insumo', example: 'litros' })
  @IsString({ message: 'La unidad debe ser una cadena de texto' })
  unidad!: string;

  @ApiProperty({ description: 'Cantidad mínima antes de generar alerta roja', example: 5 })
  @IsNumber({}, { message: 'El punto mínimo debe ser un número' })
  @Min(0)
  punto_minimo!: number;

  @ApiProperty({ description: 'Cantidad mínima antes de generar alerta amarilla', example: 15 })
  @IsNumber({}, { message: 'El punto medio debe ser un número' })
  @Min(0)
  punto_medio!: number;

  @ApiPropertyOptional({ description: 'Costo unitario del insumo', example: 12.50 })
  @IsNumber({}, { message: 'El costo unitario debe ser un número' })
  @Min(0)
  @IsOptional()
  costo_unitario?: number;

  @ApiPropertyOptional({ description: 'Cantidad inicial en inventario', example: 20 })
  @IsNumber({}, { message: 'La cantidad actual o inicial debe ser un número' })
  @Min(0)
  @IsOptional()
  cantidad_actual?: number;

  @ApiPropertyOptional({ description: 'Fecha de creación', type: String, format: 'date-time' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Fecha de última actualización', type: String, format: 'date-time' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Fecha de eliminación (soft delete)', type: String, format: 'date-time' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  deleted_at?: Date;
}

export class UpdateInsumoDto extends PartialType(CreateInsumoDto) {
  @ApiPropertyOptional({ description: 'UUID del insumo', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('all', { message: 'El id debe ser un UUID válido' })
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ description: 'Estado activo del insumo (1=activo, 0=inactivo)', example: 1 })
  @IsNumber({}, { message: 'El estado debe ser un número' })
  @IsOptional()
  estado?: number;
}

export class PaginationInsumoDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtro por estado de alerta de stock (0=Todos, 1=Alerta Roja, 2=Alerta Amarilla, 3=Sin alerta)',
    enum: [0, 1, 2, 3],
    example: 0,
    default: 0,
  })
  @IsNumber({}, { message: 'El estado debe ser un número (0=Todos, 1=Alerta Roja, 2=Alerta Amarilla, 3=Sin alerta)' })
  @IsIn([0, 1, 2, 3], { message: 'El estado debe ser 0, 1, 2 o 3' })
  @IsOptional()
  @Type(() => Number)
  estado?: number = 0;
}
