import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsPositive, IsString } from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationDto {
  @IsPositive({ message: 'Campo page debe ser un número positivo.' })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsPositive({ message: 'Campo limit debe ser un número positivo.' })
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @IsString({ message: 'Campo busqueda debe ser una cadena de texto.' })
  @IsOptional()
  busqueda?: string;

  @IsOptional({ message: 'Campo todos debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  todos?: boolean;

  @IsOptional({ message: 'Campo todos debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  empresaId?: boolean;
}
