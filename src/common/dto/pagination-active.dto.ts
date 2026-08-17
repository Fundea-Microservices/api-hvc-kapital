import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationActiveDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra por registros activos o inactivos.',
    example: true,
  })
  @IsOptional({ message: 'Campo activo debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra por registros marcados como principales.',
    example: false,
  })
  @IsOptional({ message: 'Campo principal debe ser un booleano.' })
  @IsBoolean()
  @Transform(toBoolean)
  principal?: boolean;
}
