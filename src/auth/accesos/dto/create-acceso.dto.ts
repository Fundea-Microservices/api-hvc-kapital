import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateAccesoDto {
  @IsUUID('4', { message: 'Campo menuId debe ser un UUID válido.' })
  menuId: string;

  @IsUUID('4', { message: 'Campo rolId debe ser un UUID válido.' })
  rolId: string;

  @IsNumber({}, { message: 'Campo ordenMenu debe ser un número.' })
  @Min(0, { message: 'Campo ordenMenu debe ser mayor o igual a 0.' })
  ordenMenu: number;

  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;

  @IsBoolean({ message: 'Campo showApp debe ser un valor booleano.' })
  @IsOptional()
  showApp?: boolean;

  @IsBoolean({ message: 'Campo showWeb debe ser un valor booleano.' })
  @IsOptional()
  showWeb?: boolean;

  @IsUUID('4', { message: 'Campo mainMenuId debe ser un UUID válido.' })
  @IsOptional()
  mainMenuId?: string;
}
