import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common';
import { toBoolean } from 'src/common/transformers/boolean.transformer';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

export class PaginationCatalogoRelacionDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra por el ítem origen del vínculo.',
    format: 'uuid',
  })
  @IsGuid({ message: 'Campo itemOrigenId debe ser un UUID válido.' })
  @IsOptional()
  itemOrigenId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por el ítem destino del vínculo.',
    format: 'uuid',
  })
  @IsGuid({ message: 'Campo itemDestinoId debe ser un UUID válido.' })
  @IsOptional()
  itemDestinoId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por el tipo de relación (ej. MONEDA_HABILITADA).',
    example: 'MONEDA_HABILITADA',
    maxLength: 50,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: 'Campo tipoRelacion debe ser una cadena de texto.' })
  @MaxLength(50, {
    message: 'Campo tipoRelacion no puede exceder 50 caracteres.',
  })
  @IsOptional()
  tipoRelacion?: string;

  @ApiPropertyOptional({
    description: 'Filtra relaciones activas (true) o inactivas (false).',
    example: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
