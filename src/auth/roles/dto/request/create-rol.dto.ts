import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({
    description: 'Nombre del rol.',
    example: 'Administrador',
    minLength: 3,
  })
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @MinLength(3, { message: 'Campo nombre debe tener al menos 3 caracteres.' })
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Indica si el rol puede asignarse a usuarios.',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;

  @IsBoolean({ message: 'Campo invitado debe ser un valor booleano.' })
  @ApiPropertyOptional({
    description:
      'Marca el rol como de invitado: acceso limitado y temporal al sistema.',
    example: false,
    default: false,
  })
  @IsOptional()
  invitado?: boolean;

  @IsBoolean({ message: 'Campo porDefecto debe ser un valor booleano.' })
  @ApiPropertyOptional({
    description:
      'Define si el rol es el que se asigna por defecto a los nuevos usuarios.',
    example: false,
    default: false,
  })
  @IsOptional()
  porDefecto?: boolean;
}
