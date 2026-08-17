import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { boolean } from 'joi';
import { PaginationDto } from 'src/common';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationUserDto extends PaginationDto {
  @IsOptional()
  @IsBoolean({ message: 'Campo nombre debe ser una cadena de texto.' })
  @Transform(toBoolean)
  activo?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Campo principal debe ser un booleano.' })
  @Transform(toBoolean)
  principal?: boolean;

  @IsOptional()
  @IsUUID()
  rolId?: string;

  @IsOptional()
  @IsUUID()
  metodoId?: string;

  @IsOptional()
  @IsUUID()
  puestoId?: string;
}
