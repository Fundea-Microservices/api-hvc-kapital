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
  @IsString({ message: 'El campo nombreCompleto debe ser una cadena de texto' })
  @IsOptional()
  nombreCompleto?: string;

  @IsString({ message: 'El campo nombre1 debe ser una cadena de texto' })
  @Transform(({ value }) => capitalizeFirstLetter(value))
  nombre1!: string;

  @IsString({ message: 'El campo nombre2 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  nombre2?: string;

  @IsString({ message: 'El campo nombre3 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  nombre3?: string;

  @IsString({ message: 'El campo apellido1 debe ser una cadena de texto' })
  @Transform(({ value }) => capitalizeFirstLetter(value))
  apellido1!: string;

  @IsString({ message: 'El campo apellido2 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  apellido2?: string;

  @IsString({ message: 'El campo apellido3 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  apellido3?: string;

  @IsString({ message: 'El campo documento debe ser una cadena de texto' })
  @IsOptional()
  documento?: string;

  @IsString({ message: 'El campo tipoDocumento debe ser una cadena de texto' })
  @IsOptional()
  tipoDocumento?: string;

  @IsString({ message: 'El campo userName debe ser una cadena de texto' })
  @Transform(({ value }) => value?.toLowerCase())
  userName!: string;

  @IsString({
    message:
      'El campo correo debe ser una dirección de correo electrónico válida',
  })
  @IsEmail()
  correo!: string;

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

  @IsOptional()
  @IsUUID('all', { message: 'El campo puestoId debe ser un UUID válido' })
  puestoId?: string;

  @IsUUID('all', { message: 'El campo rolId debe ser un UUID válido' })
  rolId!: string;

  // @IsUUID()
  // @IsOptional()
  // metodoId?: string;

  @IsDate({ message: 'El campo lastPasswordUpdate debe ser una fecha válida' })
  @IsOptional()
  lastPasswordUpdate?: Date;

  @IsString({ message: 'El campo fotoUrl debe ser una cadena de texto' })
  @IsOptional()
  fotoUrl?: string;

  @IsString({ message: 'El campo huella debe ser una cadena de texto' })
  @IsOptional()
  huella?: string;

  @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
  @IsOptional()
  activo?: boolean;

  @IsString({ message: 'El campo estados debe ser una cadena de texto' })
  estados!: string;

  @IsUUID('all', { message: 'El campo sucursalId debe ser un UUID válido' })
  @IsOptional()
  sucursalId?: string;
}

function capitalizeFirstLetter(value: string): string {
  if (typeof value !== 'string') return value;
  value = value.trim().toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
