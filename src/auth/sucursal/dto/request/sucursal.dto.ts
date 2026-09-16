import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSucursalDto {
  @ApiProperty({ description: 'Nombre de la sucursal', example: 'Sucursal Central' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  nombre!: string;

  @ApiProperty({ description: 'Municipio donde se ubica la sucursal', example: 'Guatemala' })
  @IsString({ message: 'El municipio debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El municipio no puede exceder 100 caracteres' })
  municipio!: string;

  @ApiProperty({ description: 'Departamento donde se ubica la sucursal', example: 'Guatemala' })
  @IsString({ message: 'El departamento debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El departamento no puede exceder 100 caracteres' })
  departamento!: string;

  @ApiPropertyOptional({ description: 'Número de teléfono de la sucursal', example: '2345-6789' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Dirección física de la sucursal', example: '5a Avenida 10-20, Zona 1' })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
  @IsOptional()
  direccion?: string;
}

export class UpdateSucursalDto extends CreateSucursalDto {
  @ApiPropertyOptional({ description: 'UUID de la sucursal', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('all', { message: 'El id debe ser un UUID válido' })
  @IsOptional()
  id?: string;
}
