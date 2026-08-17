import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario con el que se inicia sesión.',
    example: 'sysadmin',
    minLength: 3,
  })
  @IsString({ message: 'Campo userName debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo userName debe tener al menos 3 caracteres.' })
  userName!: string;

  @ApiProperty({
    description: 'Contraseña en texto plano; viaja cifrada por HTTPS.',
    example: 'S3gura!2026',
    minLength: 6,
    format: 'password',
  })
  @IsString({ message: 'Campo password debe ser una cadena de texto.' })
  @MinLength(6, { message: 'Campo password debe tener al menos 6 caracteres.' })
  password!: string;
}
