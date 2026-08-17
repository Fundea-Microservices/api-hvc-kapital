import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Campo userName debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo userName debe tener al menos 3 caracteres.' })
  userName!: string;

  @IsString({ message: 'Campo password debe ser una cadena de texto.' })
  @MinLength(6, { message: 'Campo password debe tener al menos 6 caracteres.' })
  password!: string;
}
