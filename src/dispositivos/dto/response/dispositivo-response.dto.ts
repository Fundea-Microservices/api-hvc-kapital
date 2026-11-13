import { ApiProperty } from '@nestjs/swagger';

// ─── Sobre comun de la API ───────────────────────────────────────────────────
class RespuestaBaseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '200' })
  statusCode!: string;

  @ApiProperty({ example: 'devices/enroll' })
  path!: string;

  @ApiProperty({ example: '13/11/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ nullable: true, example: null, type: Object })
  metadata!: any;
}

// ─── Enrolamiento ────────────────────────────────────────────────────────────
export class EnrollDataDto {
  @ApiProperty({
    description: 'Credencial del equipo; viaja luego en x-device-token.',
    example: '6f9619ff-8b86-d011-b42d-00c04fc964ff',
  })
  deviceToken!: string;

  @ApiProperty({
    description: 'Sucursal del usuario dueno del codigo, o HVC Kapital.',
    example: 'Agencia Central',
  })
  companyName!: string;
}

export class EnrollResponseDto extends RespuestaBaseDto {
  @ApiProperty({ example: 'Equipo enrolado exitosamente' })
  message!: string;

  @ApiProperty({ type: EnrollDataDto })
  data!: EnrollDataDto;
}

// ─── Version minima ──────────────────────────────────────────────────────────
export class CheckVersionDataDto {
  @ApiProperty({ example: true })
  valid!: boolean;

  @ApiProperty({ example: '1.0.0' })
  minVersion!: string;
}

export class CheckVersionResponseDto extends RespuestaBaseDto {
  @ApiProperty({ example: 'Version compatible' })
  message!: string;

  @ApiProperty({ type: CheckVersionDataDto })
  data!: CheckVersionDataDto;
}

// ─── Operaciones sobre un equipo ya enrolado ─────────────────────────────────
export class DispositivoDataDto {
  @ApiProperty({ example: 12 })
  idDispositivo!: number;
}

export class DispositivoResponseDto extends RespuestaBaseDto {
  @ApiProperty({ example: 'Metadatos actualizados correctamente' })
  message!: string;

  @ApiProperty({ type: DispositivoDataDto })
  data!: DispositivoDataDto;
}
