import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateRolDto } from './create-rol.dto';

export class UpdateRolDto extends CreateRolDto {
  @IsString()
  @IsUUID()
  @IsOptional()
  rolId?: string;

  @IsBoolean({ message: 'Campo esAdmin debe ser un valor booleano.' })
  @IsOptional()
  esAdmin?: boolean;

  @IsString({ message: 'Campo created_at debe ser un string.' })
  @IsOptional()
  created_at?: string;

  @IsString({ message: 'Campo updated_at debe ser un string.' })
  @IsOptional()
  updated_at?: string;

  @IsString({ message: 'Campo deleted_at debe ser un string.' })
  @IsOptional()
  deleted_at?: string;
}
