import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Datos del usuario dentro de la respuesta (sin campos sensibles) ─────────
export class UsuarioBasicoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Juan Carlos Pérez López' })
  nombreCompleto!: string;

  @ApiProperty({ example: 'Juan' })
  nombre1!: string;

  @ApiProperty({ example: 'Pérez' })
  apellido1!: string;

  @ApiProperty({ example: 'jperez' })
  userName!: string;

  @ApiProperty({ example: 'jperez@empresa.com' })
  correo!: string;

  @ApiProperty({ example: 'Local' })
  metodoAutenticacion?: string;

  @ApiPropertyOptional({ example: '+502 5555 1234' })
  telefono?: string;

  @ApiProperty({ example: true })
  activo!: boolean;

  @ApiPropertyOptional({ example: 'uuid-del-rol' })
  rolId?: string;

  @ApiPropertyOptional({ description: 'Objeto rol anidado si se cargó la relación.' })
  rol?: any;

  @ApiPropertyOptional({ description: 'Objeto sucursal anidado si se cargó la relación.' })
  sucursal?: any;
}

// ─── Login ───────────────────────────────────────────────────────────────────

export class LoginDataDto {
  @ApiProperty({ type: UsuarioBasicoDto, description: 'Datos del usuario autenticado (clave oculta).' })
  user!: UsuarioBasicoDto;

  @ApiProperty({ description: 'Token JWT para autenticar peticiones posteriores.', example: 'eyJhbGciOiJIUzI1NiIs...' })
  token!: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '200' })
  statusCode!: string;

  @ApiProperty({ example: 'auth/login' })
  path!: string;

  @ApiProperty({ example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ example: 'Login successful' })
  message!: string;

  @ApiProperty({ type: LoginDataDto })
  data!: LoginDataDto;

  @ApiProperty({ nullable: true, example: null, type:Object })
  metadata!: any;
}

// ─── Verify Token ────────────────────────────────────────────────────────────

export class VerifyTokenDataDto {
  @ApiProperty({ type: UsuarioBasicoDto, description: 'Datos del usuario validado.' })
  user!: UsuarioBasicoDto;

  @ApiProperty({ description: 'Nuevo token JWT renovado.', example: 'eyJhbGciOiJIUzI1NiIs...' })
  token!: string;
}

export class VerifyTokenResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '200' })
  statusCode!: string;

  @ApiProperty({ example: 'auth/verify-token' })
  path!: string;

  @ApiProperty({ example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ example: 'Token verificado correctamente' })
  message!: string;

  @ApiProperty({ type: VerifyTokenDataDto })
  data!: VerifyTokenDataDto;

  @ApiProperty({ nullable: true, example: null, type:Object })
  metadata!: any;
}

// ─── Get Current User (/me) ──────────────────────────────────────────────────

export class MeResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '200' })
  statusCode!: string;

  @ApiProperty({ example: 'auth/me' })
  path!: string;

  @ApiProperty({ example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ example: 'Usuario obtenido correctamente' })
  message!: string;

  @ApiProperty({ type: UsuarioBasicoDto, description: 'Datos del usuario autenticado extraídos del JWT.' })
  data!: UsuarioBasicoDto;

  @ApiProperty({ nullable: true, example: null, type:Object })
  metadata!: any;
}
