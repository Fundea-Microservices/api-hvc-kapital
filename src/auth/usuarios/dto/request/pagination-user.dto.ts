import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { toBoolean } from 'src/common/transformers/boolean.transformer';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

export class PaginationUserDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra por estado de la cuenta.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  activo!: boolean;

  @ApiPropertyOptional({
    description: 'Filtra por usuarios marcados como principales.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  principal!: boolean;

  @ApiPropertyOptional({
    description: 'Filtra los usuarios que tengan este rol.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsOptional()
  @IsGuid()
  rolId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por método asociado al usuario.',
    format: 'uuid',
  })
  @IsOptional()
  @IsGuid()
  metodoId?: string;

  @ApiPropertyOptional({
    description: 'Filtra los usuarios que ocupen este puesto.',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsOptional()
  @IsGuid()
  puestoId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por nombre del puesto (coincidencia parcial).',
    example: 'Administrador',
    minLength: 1,
  })
  @IsOptional()
  @IsString({ message: 'Campo puestoNombre debe ser una cadena de texto.' })
  @MinLength(1, {
    message: 'Campo puestoNombre debe tener al menos 1 caracter.',
  })
  puestoNombre?: string;
}
