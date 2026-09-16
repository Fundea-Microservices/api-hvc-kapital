import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateAccesoDto {
  @ApiProperty({
    description: 'UUID del menú al que se concede el acceso.',
    example: '49b66f96-ff63-4cb9-b0e3-d3c0048e2a44',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Campo menuId debe ser un UUID válido.' })
  menuId: string;

  @ApiProperty({
    description: 'UUID del rol que recibe el acceso.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Campo rolId debe ser un UUID válido.' })
  rolId: string;

  @ApiProperty({
    description: 'Posición del menú dentro del listado, de menor a mayor.',
    example: 0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Campo ordenMenu debe ser un número.' })
  @Min(0, { message: 'Campo ordenMenu debe ser mayor o igual a 0.' })
  ordenMenu: number;

  @ApiPropertyOptional({
    description: 'Indica si el acceso está habilitado.',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Muestra el menú en la aplicación móvil.',
    example: true,
  })
  @IsBoolean({ message: 'Campo showApp debe ser un valor booleano.' })
  @IsOptional()
  showApp?: boolean;

  @ApiPropertyOptional({
    description: 'Muestra el menú en la aplicación web.',
    example: true,
  })
  @IsBoolean({ message: 'Campo showWeb debe ser un valor booleano.' })
  @IsOptional()
  showWeb?: boolean;

  @ApiPropertyOptional({
    description:
      'UUID del menú padre, cuando este acceso corresponde a un submenú.',
    example: 'a328a6c4-bf37-4e9c-8619-d27f83c7e6ec',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Campo mainMenuId debe ser un UUID válido.' })
  @IsOptional()
  mainMenuId?: string;
}
