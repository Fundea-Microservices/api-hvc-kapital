import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreatePuestoDto {
  @ApiProperty({
    description: 'Nombre del puesto de trabajo.',
    example: 'Administrador General',
    minLength: 3,
  })
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo nombre debe tener al menos 3 caracteres.' })
  nombre!: string;
}
