import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMenuDto {
  @IsString({ message: 'Campo label debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo label debe tener al menos 3 caracteres.' })
  @MaxLength(30, { message: 'Campo label no puede exceder 30 caracteres.' })
  label!: string;

  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @MinLength(3, {
    message: 'Campo descripcion debe tener al menos 3 caracteres.',
  })
  @MaxLength(255, {
    message: 'Campo descripcion no puede exceder 255 caracteres.',
  })
  descripcion!: string;

  @IsString({ message: 'Campo pathApp debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo pathApp debe tener al menos 1 caracter.' })
  @MaxLength(100, { message: 'Campo pathApp no puede exceder 100 caracteres.' })
  pathApp!: string;

  @IsString({ message: 'Campo pathWeb debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo pathWeb debe tener al menos 1 caracter.' })
  @MaxLength(100, { message: 'Campo pathWeb no puede exceder 100 caracteres.' })
  pathWeb!: string;

  @IsString({ message: 'Campo icono debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo icono debe tener al menos 1 caracter.' })
  @MaxLength(80, { message: 'Campo icono no puede exceder 80 caracteres.' })
  icono!: string;

  @IsString({ message: 'Campo color debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo color debe tener al menos 3 caracteres.' })
  @MaxLength(30, { message: 'Campo color no puede exceder 30 caracteres.' })
  color!: string;

  @IsBoolean({ message: 'Campo principal debe ser un valor booleano.' })
  @IsOptional()
  principal?: boolean;

  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
