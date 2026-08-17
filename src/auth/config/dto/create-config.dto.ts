import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const TIPOS = ['string', 'number', 'boolean', 'array', 'object'] as const;
export type TipoConfig = (typeof TIPOS)[number];

export class CreateConfigDto {
  @IsString({ message: 'Campo llave debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo llave debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'Campo llave no puede exceder 50 caracteres.' })
  llave!: string;

  @IsString({ message: 'Campo valor debe ser una cadena de texto.' })
  @MinLength(1, { message: 'Campo valor debe tener al menos 1 caracter.' })
  @MaxLength(1000, { message: 'Campo valor no puede exceder 1000 caracteres.' })
  valor!: string;

  @IsString({ message: 'Campo tipo debe ser una cadena de texto.' })
  @IsIn(TIPOS as unknown as string[], {
    message: 'Campo tipo inválido. Use: string|number|boolean|array|object.',
  })
  tipo!: TipoConfig | string;

  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @IsOptional()
  @MaxLength(300, {
    message: 'Campo descripcion no puede exceder 300 caracteres.',
  })
  descripcion?: string;

  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
