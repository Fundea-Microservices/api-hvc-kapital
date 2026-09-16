import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Usuario completo (respuesta de create, findOne, update) ─────────────────

export class UsuarioResponseDataDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Juan Carlos Pérez López' })
  nombreCompleto!: string;

  @ApiProperty({ example: 'Juan' })
  nombre1!: string;

  @ApiPropertyOptional({ example: 'Carlos' })
  nombre2?: string;

  @ApiPropertyOptional({ example: 'Andrés' })
  nombre3?: string;

  @ApiProperty({ example: 'Pérez' })
  apellido1!: string;

  @ApiPropertyOptional({ example: 'López' })
  apellido2?: string;

  @ApiPropertyOptional({ example: 'de Morales' })
  apellido3?: string;

  @ApiPropertyOptional({ example: '1234567890101' })
  documento?: string;

  @ApiPropertyOptional({ example: 'DPI' })
  tipoDocumento?: string;

  @ApiProperty({ example: 'jperez' })
  userName!: string;

  @ApiProperty({ example: 'jperez@empresa.com' })
  correo!: string;

  @ApiPropertyOptional({ example: '+502 5555 1234' })
  telefono?: string;

  @ApiPropertyOptional({ example: 'Local' })
  metodoAutenticacion?: string;

  @ApiPropertyOptional({ example: 'https://cdn.empresa.com/perfiles/jperez.jpg' })
  fotoUrl?: string;

  @ApiProperty({ example: '2026-08-17T15:59:52' })
  lastPasswordUpdate!: string;

  @ApiProperty({ example: false })
  autoriza!: boolean;

  @ApiProperty({ example: true })
  activo!: boolean;

  @ApiProperty({ example: 'uuid-del-rol' })
  rolId!: string;

  @ApiPropertyOptional({ example: 'uuid-del-puesto' })
  puestoId?: string;

  @ApiPropertyOptional({ example: 'uuid-de-la-sucursal' })
  sucursalId?: string;

  @ApiPropertyOptional({ description: 'Objeto rol anidado.' })
  rol?: any;

  @ApiPropertyOptional({ description: 'Objeto puesto anidado.' })
  puesto?: any;

  @ApiPropertyOptional({ description: 'Objeto sucursal anidado.' })
  sucursal?: any;

  @ApiProperty({ example: '2026-09-16T10:30:00' })
  created_at!: string;

  @ApiPropertyOptional({ example: '2026-09-16T10:30:00' })
  updated_at?: string;
}

// ─── Respuesta estándar (create, findOne, update, remove) ────────────────────

export class UsuarioSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '201' })
  statusCode!: string;

  @ApiProperty({ example: 'auth/usuarios' })
  path!: string;

  @ApiProperty({ example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ example: 'Usuario creado exitosamente' })
  message!: string;

  @ApiProperty({ type: UsuarioResponseDataDto })
  data!: UsuarioResponseDataDto;

  @ApiProperty({ nullable: true, example: null, type:Object })
  metadata!: any;
}

// ─── Respuesta paginada (findAll) ────────────────────────────────────────────

export class PaginatedUsuarioMetadataDto {
  @ApiProperty({ description: 'Total de registros que coinciden con los filtros.', example: 150 })
  total!: number;

  @ApiProperty({ description: 'Página actual.', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Registros por página.', example: 10 })
  limit!: number;
}

export class PaginatedUsuarioResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '200' })
  statusCode!: string;

  @ApiProperty({ example: 'auth/usuarios' })
  path!: string;

  @ApiProperty({ example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ example: 'Usuarios listados correctamente' })
  message!: string;

  @ApiProperty({ type: [UsuarioResponseDataDto], description: 'Arreglo de usuarios.' })
  data!: UsuarioResponseDataDto[];

  @ApiProperty({ type: PaginatedUsuarioMetadataDto, nullable: true })
  metadata!: PaginatedUsuarioMetadataDto | null;
}

// ─── Reset / Cambiar clave ───────────────────────────────────────────────────

export class ResetClaveDataDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  usuarioId!: string;
}

export class ResetClaveResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '200' })
  statusCode!: string;

  @ApiProperty({ example: 'auth/usuarios' })
  path!: string;

  @ApiProperty({ example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ example: 'Contraseña restablecida correctamente' })
  message!: string;

  @ApiProperty({ type: ResetClaveDataDto })
  data!: ResetClaveDataDto;

  @ApiProperty({ nullable: true, example: null, type:Object })
  metadata!: any;
}

// ─── Validar autorización ────────────────────────────────────────────────────

export class ValidarAutorizacionDataDto {
  @ApiProperty({ example: 'uuid-del-solicitante' })
  solicitanteId!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  solicitanteNombre!: string;

  @ApiProperty({ example: 'jperez' })
  solicitanteUsuario!: string;

  @ApiProperty({ example: 'uuid-del-autorizador' })
  autorizadorId!: string;

  @ApiProperty({ example: 'María López' })
  autorizadorNombre!: string;

  @ApiProperty({ example: 'mlopez' })
  autorizadorUsuario!: string;

  @ApiProperty({ example: 'uuid-del-permiso' })
  permisoId!: string;

  @ApiProperty({ example: 'USR_CREAR' })
  permisoCodigo!: string;

  @ApiProperty({ example: 'Usuarios' })
  permisoModulo!: string;

  @ApiProperty({ example: 'Crear' })
  permisoAccion!: string;

  @ApiProperty({ example: 'rol', enum: ['rol', 'usuario'] })
  fuenteAutorizacion!: string;
}

export class ValidarAutorizacionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '200' })
  statusCode!: string;

  @ApiProperty({ example: 'auth/usuarios' })
  path!: string;

  @ApiProperty({ example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ example: 'Autorización validada correctamente' })
  message!: string;

  @ApiProperty({ type: ValidarAutorizacionDataDto })
  data!: ValidarAutorizacionDataDto;

  @ApiProperty({ nullable: true, example: null, type:Object })
  metadata!: any;
}
