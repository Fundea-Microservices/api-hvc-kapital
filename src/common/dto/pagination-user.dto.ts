import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class PaginationUserDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra por estado de la cuenta.',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Campo nombre debe ser una cadena de texto.' })
  @Transform(toBoolean)
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra por usuarios marcados como principales.',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Campo principal debe ser un booleano.' })
  @Transform(toBoolean)
  principal?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra los usuarios que tengan este rol.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  rolId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por método asociado al usuario.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  metodoId?: string;

  @ApiPropertyOptional({
    description: 'Filtra los usuarios que ocupen este puesto.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  puestoId?: string;
}
