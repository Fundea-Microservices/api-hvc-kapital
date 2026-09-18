import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsUUID } from 'class-validator';

export class ValidarAuthCodeDto {
  @ApiProperty({
    description:
      'Código de autorización (auth_code) del usuario que autorizará la operación. Debe pertenecer a un usuario activo con campo autoriza = true. Si el solicitante es administrador, no puede enviar su propio auth_code.',
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

  @ApiProperty({
    description:
      'UUID del permiso que se quiere autorizar. Se valida que el usuario autorizador (o su rol) tenga el campo autoriza = true para este permiso específico en la tabla Permiso_Rol o Permiso_Usuario.',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID('all', {
    message: 'El campo permisoId debe ser un UUID válido',
  })
  permisoId!: string;
}
