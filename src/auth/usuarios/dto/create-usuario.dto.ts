import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  isUUID,
  IsUUID,
} from 'class-validator';

export class CreateUsuarioDto {
  @ApiPropertyOptional({
    description:
      'Nombre completo ya armado. Si se omite, se compone a partir de nombres y apellidos.',
    example: 'Juan Carlos Pérez López',
  })
  @IsString({ message: 'El campo nombreCompleto debe ser una cadena de texto' })
  @IsOptional()
  nombreCompleto?: string;

  @ApiProperty({
    description: 'Primer nombre. Se normaliza a capitalización inicial.',
    example: 'Juan',
  })
  @IsString({ message: 'El campo nombre1 debe ser una cadena de texto' })
  @Transform(({ value }) => capitalizeFirstLetter(value))
  nombre1!: string;

  @ApiPropertyOptional({ description: 'Segundo nombre.', example: 'Carlos' })
  @IsString({ message: 'El campo nombre2 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  nombre2?: string;

  @ApiPropertyOptional({ description: 'Tercer nombre.', example: 'Andrés' })
  @IsString({ message: 'El campo nombre3 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  nombre3?: string;

  @ApiProperty({
    description: 'Primer apellido. Se normaliza a capitalización inicial.',
    example: 'Pérez',
  })
  @IsString({ message: 'El campo apellido1 debe ser una cadena de texto' })
  @Transform(({ value }) => capitalizeFirstLetter(value))
  apellido1!: string;

  @ApiPropertyOptional({ description: 'Segundo apellido.', example: 'López' })
  @IsString({ message: 'El campo apellido2 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  apellido2?: string;

  @ApiPropertyOptional({
    description: 'Apellido de casada u otro tercer apellido.',
    example: 'de Morales',
  })
  @IsString({ message: 'El campo apellido3 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  apellido3?: string;

  @ApiPropertyOptional({
    description: 'Número del documento de identificación.',
    example: '1234567890101',
  })
  @IsString({ message: 'El campo documento debe ser una cadena de texto' })
  @IsOptional()
  documento?: string;

  @ApiPropertyOptional({
    description: 'Clase de documento presentado.',
    example: 'DPI',
  })
  @IsString({ message: 'El campo tipoDocumento debe ser una cadena de texto' })
  @IsOptional()
  tipoDocumento?: string;

  @ApiProperty({
    description:
      'Nombre de usuario para iniciar sesión. Se guarda siempre en minúsculas.',
    example: 'jperez',
  })
  @IsString({ message: 'El campo userName debe ser una cadena de texto' })
  @Transform(({ value }) => value?.toLowerCase())
  userName!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario.',
    example: 'jperez@fundea.org.gt',
    format: 'email',
  })
  @IsString({
    message:
      'El campo correo debe ser una dirección de correo electrónico válida',
  })
  @IsEmail()
  correo!: string;

  @ApiPropertyOptional({
    description:
      'Contraseña inicial. Si se omite, el usuario queda sin clave hasta que un administrador la asigne.',
    example: 'Temporal!2026',
    format: 'password',
  })
  @IsString({ message: 'El campo clave debe ser una cadena de texto' })
  // @IsStrongPassword(
  //   {},
  //   {
  //     message:
  //       'El campo clave no cumple con los requisitos de seguridad. Require al menos una mayúscula, una minúscula, un número y un símbolo.',
  //   },
  // )
  @IsOptional()
  clave?: string;

  @ApiPropertyOptional({
    description: 'UUID del puesto asignado.',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'El campo puestoId debe ser un UUID válido' })
  puestoId?: string;

  @ApiProperty({
    description: 'UUID del rol asignado. Determina los permisos del usuario.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('all', { message: 'El campo rolId debe ser un UUID válido' })
  rolId!: string;

  // @IsUUID()
  // @IsOptional()
  // metodoId?: string;

  @ApiPropertyOptional({
    description: 'Fecha del último cambio de contraseña, en UTC.',
    example: '2026-08-17T15:59:52.000Z',
    type: Date,
  })
  @IsDate({ message: 'El campo lastPasswordUpdate debe ser una fecha válida' })
  @IsOptional()
  lastPasswordUpdate?: Date;

  @ApiPropertyOptional({
    description: 'URL de la fotografía de perfil.',
    example: 'https://cdn.hvckapital.com/perfiles/jperez.jpg',
  })
  @IsString({ message: 'El campo fotoUrl debe ser una cadena de texto' })
  @IsOptional()
  fotoUrl?: string;

  @ApiPropertyOptional({
    description: 'Huella digital registrada para autenticación biométrica.',
  })
  @IsString({ message: 'El campo huella debe ser una cadena de texto' })
  @IsOptional()
  huella?: string;

  @ApiPropertyOptional({
    description:
      'Código de autorización personal del usuario (PIN). Se usa como mecanismo de doble verificación para acciones sensibles. Debe ser único entre usuarios.',
    example: '1234',
    minLength: 1,
    maxLength: 10,
  })
  @IsString({ message: 'El campo auth_code debe ser una cadena de texto' })
  @IsOptional()
  auth_code?: string;

  @ApiPropertyOptional({
    description:
      'Indica si el usuario tiene la capacidad de autorizar acciones de otros usuarios que lo requieran.',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'El campo autoriza debe ser un valor booleano' })
  @IsOptional()
  autoriza?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si la cuenta está habilitada.',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
  @IsOptional()
  activo?: boolean;

  @ApiProperty({
    description: 'Estado del usuario dentro del flujo de la organización.',
    example: 'ACTIVO',
  })
  @IsString({ message: 'El campo estados debe ser una cadena de texto' })
  estados!: string;

  @ApiPropertyOptional({
    description: 'UUID de la sucursal a la que pertenece el usuario.',
    example: '550e8400-e29b-41d4-a716-446655440004',
    format: 'uuid',
  })
  @IsUUID('all', { message: 'El campo sucursalId debe ser un UUID válido' })
  @IsOptional()
  sucursalId?: string;
}

function capitalizeFirstLetter(value: string): string {
  if (typeof value !== 'string') return value;
  value = value.trim().toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
