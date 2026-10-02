import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { capitalizeFirstLetter } from './create-usuario.dto';

/**
 * DTO para que un usuario autenticado actualice SU PROPIO perfil (Mi Perfil).
 *
 * Seguridad (anti mass-assignment): a propósito solo contiene los campos
 * básicos visibles en el frontend. Campos sensibles como rolId, activo,
 * autoriza, userName, clave, auth_code, puestoId, sucursalId, etc. NO existen
 * aquí, por lo que el ValidationPipe global (whitelist + forbidNonWhitelisted)
 * los rechaza con 400 aunque se envíen en el body.
 *
 * Todos los campos son opcionales: el endpoint tiene semántica de PATCH,
 * solo se sobrescriben los campos enviados.
 */
export class UpdateMiPerfilDto {
  @ApiPropertyOptional({
    description: 'Primer nombre. Se normaliza a capitalización inicial.',
    example: 'Juan',
    maxLength: 50,
  })
  @IsString({ message: 'El campo nombre1 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  nombre1?: string;

  @ApiPropertyOptional({
    description: 'Segundo nombre.',
    example: 'Carlos',
    maxLength: 50,
  })
  @IsString({ message: 'El campo nombre2 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  nombre2?: string;

  @ApiPropertyOptional({
    description: 'Tercer nombre.',
    example: 'Andrés',
    maxLength: 50,
  })
  @IsString({ message: 'El campo nombre3 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  nombre3?: string;

  @ApiPropertyOptional({
    description: 'Primer apellido. Se normaliza a capitalización inicial.',
    example: 'Pérez',
    maxLength: 50,
  })
  @IsString({ message: 'El campo apellido1 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  apellido1?: string;

  @ApiPropertyOptional({
    description: 'Segundo apellido.',
    example: 'López',
    maxLength: 50,
  })
  @IsString({ message: 'El campo apellido2 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  apellido2?: string;

  @ApiPropertyOptional({
    description: 'Apellido de casada u otro tercer apellido.',
    example: 'de Morales',
    maxLength: 50,
  })
  @IsString({ message: 'El campo apellido3 debe ser una cadena de texto' })
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  apellido3?: string;

  @ApiPropertyOptional({
    description:
      'Correo electrónico del usuario. Debe ser único en el sistema.',
    example: 'jperez@fundea.org.gt',
    format: 'email',
    maxLength: 60,
  })
  @IsString({
    message:
      'El campo correo debe ser una dirección de correo electrónico válida',
  })
  @IsEmail(
    {},
    {
      message:
        'El campo correo debe ser una dirección de correo electrónico válida',
    },
  )
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono del usuario.',
    example: '+502 5555 1234',
    maxLength: 20,
  })
  @IsString({ message: 'El campo telefono debe ser una cadena de texto' })
  @MaxLength(20, {
    message: 'El campo telefono no puede exceder los 20 caracteres.',
  })
  @IsOptional()
  telefono?: string;
}
