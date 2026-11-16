import { ApiProperty } from '@nestjs/swagger';

// Banderas y credenciales que la app necesita justo despues del login.
export class SesionDataDto {
  @ApiProperty({
    description:
      'Refresh token en claro. Solo se devuelve aqui: en base de ' +
      'datos queda su hash SHA-256.',
  })
  refreshToken!: string;

  @ApiProperty({ description: 'Vencimiento del refresh token (ISO 8601).' })
  expiraEn!: string;

  @ApiProperty({
    description:
      'Primer ingreso: la app fuerza el cambio de clave antes del dashboard.',
  })
  requiereCambioPassword!: boolean;

  @ApiProperty({
    description:
      'Codigo de auth.TipoUsuario; null si el usuario no esta clasificado.',
    nullable: true,
  })
  tipoUsuario!: string | null;
}

export class SesionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 201 })
  statusCode!: number;

  @ApiProperty({ example: 'auth/sesion' })
  path!: string;

  @ApiProperty({ example: '13/11/2026 14:40:11' })
  timestamp!: string;

  @ApiProperty({ example: 'Sesion registrada' })
  message!: string;

  @ApiProperty({ type: SesionDataDto })
  data!: SesionDataDto;

  @ApiProperty({ nullable: true, example: null })
  metadata!: unknown;
}

// Igual que SesionDataDto pero con el access token recien emitido.
export class RefrescoDataDto extends SesionDataDto {
  @ApiProperty({ description: 'Nuevo access token JWT.' })
  token!: string;
}

export class RefrescoResponseDto extends SesionResponseDto {
  @ApiProperty({ type: RefrescoDataDto })
  declare data: RefrescoDataDto;
}
