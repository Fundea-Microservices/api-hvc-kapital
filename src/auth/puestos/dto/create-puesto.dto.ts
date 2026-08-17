import { IsString, MinLength } from 'class-validator';

export class CreatePuestoDto {
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo nombre debe tener al menos 3 caracteres.' })
  nombre!: string;
}
