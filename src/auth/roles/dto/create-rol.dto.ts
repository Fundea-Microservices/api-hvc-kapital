import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRolDto {
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo nombre debe tener al menos 3 caracteres.' })
  nombre!: string;

  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;

  @IsBoolean({ message: 'Campo invitado debe ser un valor booleano.' })
  @IsOptional()
  invitado?: boolean;
}
