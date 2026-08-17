import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsUUID,
  IsString,
  MinLength,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationUserDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  activo!: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  principal!: boolean;

  @IsOptional()
  @IsUUID()
  rolId?: string;

  @IsOptional()
  @IsUUID()
  metodoId?: string;

  @IsOptional()
  @IsUUID()
  puestoId?: string;

  @IsOptional()
  @IsString({ message: 'Campo puestoNombre debe ser una cadena de texto.' })
  @MinLength(1, {
    message: 'Campo puestoNombre debe tener al menos 1 caracter.',
  })
  puestoNombre?: string;
}
