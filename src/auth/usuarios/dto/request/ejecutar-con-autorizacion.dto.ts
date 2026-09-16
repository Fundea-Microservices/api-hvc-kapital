import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
  IsIn,
  IsObject,
  IsOptional,
} from 'class-validator';

export class EjecutarConAutorizacionDto {
  @ApiProperty({
    description:
      'Ruta del endpoint destino (sin prefijo global). Ejemplo: "auth/usuarios" para POST /v1/auth/usuarios. Para endpoints con parámetros de ruta, usar params.',
    example: 'auth/usuarios',
    minLength: 1,
    maxLength: 200,
  })
  @IsString({ message: 'El campo endpoint debe ser una cadena de texto' })
  @MinLength(1, { message: 'El campo endpoint debe tener al menos 1 carácter' })
  @MaxLength(200, {
    message: 'El campo endpoint no puede exceder 200 caracteres',
  })
  endpoint!: string;

  @ApiProperty({
    description: 'Método HTTP del endpoint destino.',
    example: 'POST',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
  @IsString({ message: 'El campo metodoHttp debe ser una cadena de texto' })
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], {
    message:
      'El campo metodoHttp debe ser uno de: GET, POST, PUT, PATCH, DELETE',
  })
  metodoHttp!: string;

  @ApiProperty({
    description:
      'Cuerpo de la petición HTTP original (JSON). Opcional para métodos GET y DELETE.',
    example: {
      nombre1: 'Juan',
      apellido1: 'Pérez',
      rolId: '550e8400-e29b-41d4-a716-446655440000',
    },
    required: false,
  })
  @IsObject({ message: 'El campo body debe ser un objeto JSON' })
  @IsOptional()
  body?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Parámetros de ruta para endpoints con :id. Ejemplo: { "id": "uuid-del-usuario" } para PUT/DELETE auth/usuarios/:id.',
    example: { id: '550e8400-e29b-41d4-a716-446655440000' },
  })
  @IsObject({ message: 'El campo params debe ser un objeto JSON' })
  @IsOptional()
  params?: Record<string, string>;

  @ApiProperty({
    description:
      'UUID del permiso requerido para autorizar esta operación. Se valida que el autorizador (o su rol) tenga autoriza=true para este permiso.',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID('all', {
    message: 'El campo permisoId debe ser un UUID válido',
  })
  permisoId!: string;

  @ApiProperty({
    description:
      'Código de autorización (auth_code) del usuario que autorizará la operación. Debe pertenecer a un usuario activo con campo autoriza = true.',
    example: 'A1B2C3',
    minLength: 1,
    maxLength: 10,
  })
  @IsString({
    message: 'El campo auth_code debe ser una cadena de texto',
  })
  @MinLength(1, {
    message: 'El campo auth_code debe tener al menos 1 carácter',
  })
  @MaxLength(10, {
    message: 'El campo auth_code no puede exceder 10 caracteres',
  })
  auth_code!: string;
}
