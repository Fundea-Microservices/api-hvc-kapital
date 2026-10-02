import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoAsignacionEnum } from '../request/permiso-usuario.dto';

export class MatrizUsuarioRowDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id!: string;

  @ApiProperty({ example: 'USR_CREAR' })
  codigo!: string;

  @ApiProperty({ example: 'Usuarios' })
  modulo!: string;

  @ApiProperty({ example: 'Crear' })
  accion!: string;

  @ApiPropertyOptional({ example: 'Crear usuarios' })
  descripcion?: string;

  @ApiProperty({ example: true })
  activo!: boolean;

  @ApiProperty({ example: false })
  requires_auth!: boolean;

  @ApiPropertyOptional({ example: '2026-09-16T10:30:00' })
  created_at?: Date;

  @ApiPropertyOptional({ example: '2026-09-16T10:30:00' })
  updated_at?: Date;

  @ApiProperty({
    description:
      'true si el permiso es EFECTIVO para el usuario (concedido directamente ' +
      'o heredado del rol sin bloqueo directo).',
    example: true,
  })
  asignado!: boolean;

  @ApiProperty({
    description:
      'Origen del permiso con precedencia usuario > rol: USUARIO = excepción ' +
      'directa en Permiso_Usuario (su campo permitido decide: concede o bloquea); ' +
      'ROL = heredado de Permiso_Rol sin excepción directa; ' +
      'NO_ASIGNADO = ni por rol ni por usuario.',
    enum: TipoAsignacionEnum,
    example: TipoAsignacionEnum.ROL,
  })
  tipoAsignacion!: TipoAsignacionEnum;

  @ApiProperty({
    description:
      'Alias de "tipoAsignacion" para renderizar el tag visual en el frontend: ' +
      '"ROL" → tag "Heredado del Rol"; "USUARIO" → tag "Asignación Directa"; ' +
      '"NO_ASIGNADO" → sin tag (permiso no otorgado). Valores en mayúsculas.',
    enum: TipoAsignacionEnum,
    example: TipoAsignacionEnum.ROL,
  })
  origen!: TipoAsignacionEnum;
}

export class MatrizUsuarioMetadataDto {
  @ApiProperty({
    description: 'Total de registros que coinciden con los filtros.',
    example: 42,
  })
  total!: number;

  @ApiProperty({ description: 'Página actual.', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Registros por página.', example: 10 })
  limit!: number;
}

export class MatrizUsuarioResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '200' })
  statusCode!: string;

  @ApiProperty({ example: 'auth/permisos' })
  path!: string;

  @ApiProperty({ example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ example: 'Matriz de permisos efectivos del usuario generada correctamente' })
  message!: string;

  @ApiProperty({ type: [MatrizUsuarioRowDto] })
  data!: MatrizUsuarioRowDto[];

  @ApiProperty({
    description:
      'Información de paginación (total/page/limit); null cuando se usa todos=true.',
    nullable: true,
    example: { total: 42, page: 1, limit: 10 },
    type: MatrizUsuarioMetadataDto,
  })
  metadata!: MatrizUsuarioMetadataDto | null;
}
