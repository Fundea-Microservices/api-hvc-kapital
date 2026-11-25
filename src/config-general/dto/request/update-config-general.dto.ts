import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  DPI_REGEX,
  FECHA_REGEX,
  HORA_REGEX,
} from 'src/config-general/utils/config-general.util';

/**
 * Actualización parcial del singleton. `justificacion` es obligatoria;
 * `auth_code` solo se exige cuando cambian fechaCierre, fechaApertura o
 * cierreMensual (lo valida el servicio contra el valor actual).
 */
export class UpdateConfigGeneralDto {
  @ApiPropertyOptional({
    description: 'Código interno institucional único.',
    example: 'HVC-CORP-001',
  })
  @IsOptional()
  @IsString({ message: 'Campo codigoInterno debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo codigoInterno no puede estar vacío.' })
  @MaxLength(30, { message: 'Campo codigoInterno no puede exceder 30 caracteres.' })
  codigoInterno?: string;

  @ApiPropertyOptional({
    description: 'Razón social o nombre comercial.',
    example: 'HVC Kapital Sociedad Anónima',
  })
  @IsOptional()
  @IsString({ message: 'Campo nombreComercial debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo nombreComercial no puede estar vacío.' })
  @MaxLength(150, { message: 'Campo nombreComercial no puede exceder 150 caracteres.' })
  nombreComercial?: string;

  @ApiPropertyOptional({
    description: 'UUID de un DominioValor activo del dominio CASA_CENTRAL.',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Campo codigoCasaCentral debe ser un UUID válido.' })
  codigoCasaCentral?: string;

  @ApiPropertyOptional({
    description: 'UUID de un DominioValor activo del dominio PAIS.',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Campo pais debe ser un UUID válido.' })
  pais?: string;

  @ApiPropertyOptional({
    description: 'UUID de un DominioValor activo del dominio MONEDA.',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Campo monedaPrincipal debe ser un UUID válido.' })
  monedaPrincipal?: string;

  @ApiPropertyOptional({
    description: 'Fecha del último cierre diario (YYYY-MM-DD). Requiere auth_code.',
    example: '2026-11-23',
  })
  @IsOptional()
  @Matches(FECHA_REGEX, {
    message: 'Campo fechaCierre debe tener formato YYYY-MM-DD.',
  })
  @IsDateString({ strict: true }, { message: 'Campo fechaCierre debe ser una fecha válida.' })
  fechaCierre?: string;

  @ApiPropertyOptional({
    description: 'Fecha contable vigente abierta (YYYY-MM-DD). Requiere auth_code.',
    example: '2026-11-24',
  })
  @IsOptional()
  @Matches(FECHA_REGEX, {
    message: 'Campo fechaApertura debe tener formato YYYY-MM-DD.',
  })
  @IsDateString({ strict: true }, { message: 'Campo fechaApertura debe ser una fecha válida.' })
  fechaApertura?: string;

  @ApiPropertyOptional({
    description: 'Fecha del último cierre mensual (YYYY-MM-DD). Requiere auth_code.',
    example: '2026-10-31',
  })
  @IsOptional()
  @Matches(FECHA_REGEX, {
    message: 'Campo cierreMensual debe tener formato YYYY-MM-DD.',
  })
  @IsDateString({ strict: true }, { message: 'Campo cierreMensual debe ser una fecha válida.' })
  cierreMensual?: string;

  @ApiPropertyOptional({ description: 'NIT tributario.', example: '7845129-3' })
  @IsOptional()
  @IsString({ message: 'Campo nit debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo nit no puede estar vacío.' })
  @MaxLength(20, { message: 'Campo nit no puede exceder 20 caracteres.' })
  nit?: string;

  @ApiPropertyOptional({
    description: 'Código de registro ante la Superintendencia de Bancos.',
    example: 'SIB-1234',
  })
  @IsOptional()
  @IsString({ message: 'Campo codigoSIB debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo codigoSIB no puede estar vacío.' })
  @MaxLength(30, { message: 'Campo codigoSIB no puede exceder 30 caracteres.' })
  codigoSIB?: string;

  @ApiPropertyOptional({
    description: 'Código de inscripción en el Registro de Valores y Mercancías.',
    example: 'RMV-1234',
  })
  @IsOptional()
  @IsString({ message: 'Campo registroMercadoValores debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo registroMercadoValores no puede estar vacío.' })
  @MaxLength(30, { message: 'Campo registroMercadoValores no puede exceder 30 caracteres.' })
  registroMercadoValores?: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del representante legal vigente.',
    example: 'Juan Pérez López',
  })
  @IsOptional()
  @IsString({ message: 'Campo representanteLegal debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo representanteLegal no puede estar vacío.' })
  @MaxLength(150, { message: 'Campo representanteLegal no puede exceder 150 caracteres.' })
  representanteLegal?: string;

  @ApiPropertyOptional({
    description: 'DPI/CUI de 13 dígitos del representante legal.',
    example: '1234567890101',
  })
  @IsOptional()
  @Matches(DPI_REGEX, {
    message: 'Campo dpiRepresentante debe contener exactamente 13 dígitos.',
  })
  dpiRepresentante?: string;

  @ApiPropertyOptional({
    description: 'Dirección fiscal registrada.',
    example: 'Ciudad de Guatemala, Guatemala',
  })
  @IsOptional()
  @IsString({ message: 'Campo direccionFiscal debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo direccionFiscal no puede estar vacío.' })
  @MaxLength(300, { message: 'Campo direccionFiscal no puede exceder 300 caracteres.' })
  direccionFiscal?: string;

  @ApiPropertyOptional({
    description: 'Hora de inicio de operaciones en formato HH:MM.',
    example: '08:30',
  })
  @IsOptional()
  @Matches(HORA_REGEX, {
    message: 'Campo horaInicioOp debe tener formato HH:MM (00:00 a 23:59).',
  })
  horaInicioOp?: string;

  @ApiPropertyOptional({
    description: 'Hora de cierre de operaciones en formato HH:MM.',
    example: '17:00',
  })
  @IsOptional()
  @Matches(HORA_REGEX, {
    message: 'Campo horaCierreOp debe tener formato HH:MM (00:00 a 23:59).',
  })
  horaCierreOp?: string;

  @ApiPropertyOptional({ description: 'Estado operativo del registro.', example: true })
  @IsOptional()
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  activo?: boolean;

  @ApiProperty({
    description:
      'Motivo regulatorio o institucional del cambio. Obligatorio en toda edición.',
    example: 'Ajuste de cierre diario por conciliación contable.',
  })
  @IsString({ message: 'Campo justificacion debe ser una cadena de texto.' })
  @MinLength(10, { message: 'Campo justificacion debe tener al menos 10 caracteres.' })
  @MaxLength(500, { message: 'Campo justificacion no puede exceder 500 caracteres.' })
  justificacion!: string;

  @ApiPropertyOptional({
    description:
      'Código de autorización del supervisor. Obligatorio solo si se modifican fechaCierre, fechaApertura o cierreMensual.',
    example: 'A1B2C3',
  })
  @IsOptional()
  @IsString({ message: 'Campo auth_code debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo auth_code no puede estar vacío.' })
  @MaxLength(10, { message: 'Campo auth_code no puede exceder 10 caracteres.' })
  auth_code?: string;
}
