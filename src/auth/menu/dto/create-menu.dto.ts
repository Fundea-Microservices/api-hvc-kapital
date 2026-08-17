import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({
    description: 'Texto que se muestra en el menú.',
    example: 'Usuarios',
    minLength: 3,
    maxLength: 30,
  })
  @IsString({ message: 'Campo label debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo label debe tener al menos 3 caracteres.' })
  @MaxLength(30, { message: 'Campo label no puede exceder 30 caracteres.' })
  label!: string;

  @ApiProperty({
    description: 'Explica qué contiene la sección.',
    example: 'Manejo de usuarios',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @MinLength(3, {
    message: 'Campo descripcion debe tener al menos 3 caracteres.',
  })
  @MaxLength(255, {
    message: 'Campo descripcion no puede exceder 255 caracteres.',
  })
  descripcion!: string;

  @ApiProperty({
    description: 'Ruta de navegación dentro de la aplicación móvil.',
    example: '/config/usuarios',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'Campo pathApp debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo pathApp debe tener al menos 1 caracter.' })
  @MaxLength(100, { message: 'Campo pathApp no puede exceder 100 caracteres.' })
  pathApp!: string;

  @ApiProperty({
    description: 'Ruta de navegación dentro de la aplicación web.',
    example: '/config/usuarios',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'Campo pathWeb debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo pathWeb debe tener al menos 1 caracter.' })
  @MaxLength(100, { message: 'Campo pathWeb no puede exceder 100 caracteres.' })
  pathWeb!: string;

  @ApiProperty({
    description: 'Nombre del icono asociado a la entrada de menú.',
    example: 'circle-user-round',
    minLength: 1,
    maxLength: 80,
  })
  @IsString({ message: 'Campo icono debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo icono debe tener al menos 1 caracter.' })
  @MaxLength(80, { message: 'Campo icono no puede exceder 80 caracteres.' })
  icono!: string;

  @ApiProperty({
    description: 'Color con el que se pinta el icono.',
    example: 'black',
    minLength: 3,
    maxLength: 30,
  })
  @IsString({ message: 'Campo color debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo color debe tener al menos 3 caracteres.' })
  @MaxLength(30, { message: 'Campo color no puede exceder 30 caracteres.' })
  color!: string;

  @ApiPropertyOptional({
    description:
      'Marca la entrada como menú de primer nivel, no como submenú.',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'Campo principal debe ser un valor booleano.' })
  @IsOptional()
  principal?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si la entrada de menú está visible.',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
