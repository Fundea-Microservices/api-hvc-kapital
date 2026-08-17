import { IsString, IsOptional, IsUUID, IsDate } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoriaInsumoDto {
  @ApiProperty({ description: 'Nombre de la categoría de insumo', example: 'Limpieza' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre!: string;

  @ApiPropertyOptional({ description: 'Descripción de la categoría', example: 'Productos de limpieza e higiene' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  descripcion?: string;

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

export class UpdateCategoriaInsumoDto extends PartialType(CreateCategoriaInsumoDto) {
  @ApiPropertyOptional({ description: 'UUID de la categoría', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('all', { message: 'El id debe ser un UUID válido' })
  @IsOptional()
  id?: string;
}
