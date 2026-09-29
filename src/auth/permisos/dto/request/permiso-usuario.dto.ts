import { IsBoolean, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsGuid } from 'src/common/validators/is-guid.decorator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class CreatePermisoUsuarioDto {
  @ApiProperty({ description: 'UUID del usuario', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsGuid({ message: 'El usuarioId debe ser un UUID válido' })
  usuarioId!: string;

  @ApiProperty({ description: 'UUID del permiso', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsGuid({ message: 'El permisoId debe ser un UUID válido' })
  permisoId!: string;

  @ApiPropertyOptional({ description: 'Indica si el permiso está concedido al usuario', example: true, default: true })
  @IsBoolean({ message: 'El campo permitido debe ser un booleano' })
  @IsOptional()
  permitido?: boolean;

  @ApiPropertyOptional({ description: 'Indica si el usuario tiene capacidad de autorizar acciones que requieren autorización para este permiso', example: false, default: false })
  @IsBoolean({ message: 'El campo autoriza debe ser un booleano' })
  @IsOptional()
  autoriza?: boolean;
}

export class UpdatePermisoUsuarioDto {
  @ApiProperty({ description: 'Indica si el permiso está concedido al usuario', example: false })
  @IsBoolean({ message: 'El campo permitido debe ser un booleano' })
  permitido!: boolean;

  @ApiPropertyOptional({ description: 'Indica si el usuario tiene capacidad de autorizar acciones que requieren autorización para este permiso', example: false, default: false })
  @IsBoolean({ message: 'El campo autoriza debe ser un booleano' })
  @IsOptional()
  autoriza?: boolean;
}

export class MatrizPermisoUsuarioDto {
  @ApiProperty({ description: 'UUID del usuario del que se construye la matriz', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsGuid({ message: 'El usuarioId debe ser un UUID válido' })
  usuarioId!: string;

  @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1 })
  @IsPositive({ message: 'Campo page debe ser un número positivo.' })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad de registros por página', example: 10, default: 10 })
  @IsPositive({ message: 'Campo limit debe ser un número positivo.' })
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Filtra por módulo o descripción (LIKE)', example: 'usuarios' })
  @IsString({ message: 'El campo modulo debe ser una cadena de texto.' })
  @IsOptional()
  modulo?: string;

  @ApiPropertyOptional({ description: 'Filtra por acción o descripción (LIKE)', example: 'crear' })
  @IsString({ message: 'El campo accion debe ser una cadena de texto.' })
  @IsOptional()
  accion?: string;

  @ApiPropertyOptional({ description: 'Filtra por código del permiso (LIKE)', example: 'USR' })
  @IsString({ message: 'El campo codigo debe ser una cadena de texto.' })
  @IsOptional()
  codigo?: string;

  @ApiPropertyOptional({
    description:
      'Filtra la matriz por estado de asignación efectiva al usuario: true = solo permisos EFECTIVOS ' +
      '(excepción directa o heredados del rol), false = solo permisos NO EFECTIVOS. ' +
      'Si se omite, devuelve la matriz completa (Todos).',
    example: true,
  })
  @IsBoolean({ message: 'Campo asignado debe ser un booleano.' })
  @IsOptional()
  @Transform(toBoolean)
  asignado?: boolean;

  @ApiPropertyOptional({ description: 'Si es true, ignora la paginación y devuelve todos', example: false })
  @IsBoolean({ message: 'Campo todos debe ser un booleano.' })
  @IsOptional()
  @Transform(toBoolean)
  todos?: boolean;
}
