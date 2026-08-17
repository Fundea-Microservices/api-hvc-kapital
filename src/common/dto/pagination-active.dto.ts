import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationActiveDto extends PaginationDto {
  @IsOptional({ message: 'Campo activo debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  activo?: boolean;

  @IsOptional({ message: 'Campo principal debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  principal?: boolean;
}
