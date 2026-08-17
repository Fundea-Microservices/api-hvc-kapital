import { IsString, IsUUID, IsNumber, IsEnum, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovimientoInsumoDto {
  @ApiProperty({ description: 'UUID del insumo al que pertenece el movimiento', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('all', { message: 'El insumo debe ser un UUID válido' })
  insumo_id!: string;

  @ApiProperty({ description: 'Tipo de movimiento de inventario', enum: ['ENTRADA', 'SALIDA', 'AJUSTE'], example: 'ENTRADA' })
  @IsEnum(['ENTRADA', 'SALIDA', 'AJUSTE'], { message: 'Tipo de movimiento inválido' })
  tipo_movimiento!: string;

  @ApiProperty({ description: 'Cantidad de unidades del movimiento. Para AJUSTE se establece como nueva cantidad total', example: 10 })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  cantidad!: number;

  @ApiPropertyOptional({ description: 'Motivo o descripción del movimiento', example: 'Compra a proveedor XYZ' })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsOptional()
  motivo?: string;

  @ApiPropertyOptional({ description: 'Fecha en que ocurrió el movimiento', type: String, format: 'date-time' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  fecha_movimiento?: Date;

  @ApiPropertyOptional({ description: 'Costo unitario al momento del movimiento', example: 12.50 })
  @IsNumber({}, { message: 'El costo unitario debe ser un número' })
  @Min(0, { message: 'El costo unitario no puede ser negativo' })
  @IsOptional()
  costo_unitario?: number;

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
