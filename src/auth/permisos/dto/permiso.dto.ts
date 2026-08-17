import { IsString, IsOptional, IsUUID, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermisoDto {
  @ApiProperty({ description: 'Código único del permiso', example: 'USR_CREAR' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
  @MaxLength(20, { message: 'El código no puede exceder 20 caracteres' })
  codigo!: string;

  @ApiProperty({ description: 'Módulo al que pertenece el permiso', example: 'usuarios' })
  @IsString({ message: 'El módulo debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El módulo no puede exceder 50 caracteres' })
  modulo!: string;

  @ApiProperty({ description: 'Acción que habilita el permiso', example: 'crear' })
  @IsString({ message: 'La acción debe ser una cadena de texto' })
  @MaxLength(50, { message: 'La acción no puede exceder 50 caracteres' })
  accion!: string;

  @ApiPropertyOptional({ description: 'Descripción del permiso', example: 'Permite crear nuevos usuarios' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(250, { message: 'La descripción no puede exceder 250 caracteres' })
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Indica si el permiso está activo', example: true, default: true })
  @IsBoolean({ message: 'El campo activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

export class UpdatePermisoDto extends CreatePermisoDto {
  @ApiPropertyOptional({ description: 'UUID del permiso', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('all', { message: 'El permisoId debe ser un UUID válido' })
  @IsOptional()
  permisoId?: string;
}
