import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto';

export class UpdateUsuarioDto extends CreateUsuarioDto {
  @IsUUID()
  @IsOptional()
  usuarioId!: string;

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
