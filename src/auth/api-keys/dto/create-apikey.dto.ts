import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class CreateApikeyDto {
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo nombre debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'Campo nombre no puede exceder 50 caracteres.' })
  nombre!: string;

  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @MinLength(3, {
    message: 'Campo descripcion debe tener al menos 3 caracteres.',
  })
  @MaxLength(250, {
    message: 'Campo descripcion no puede exceder 250 caracteres.',
  })
  descripcion!: string;

  @IsString({ message: 'Campo valor debe ser una cadena de texto.' })
  @Matches(/^[0-9a-fA-F]{64}$/, {
    message:
      'Campo valor debe ser una cadena hexadecimal de exactamente 64 caracteres.',
  })
  valor!: string;

  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
