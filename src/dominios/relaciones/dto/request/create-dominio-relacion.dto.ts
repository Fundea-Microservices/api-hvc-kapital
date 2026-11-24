import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';
import { IsGuid } from 'src/common/validators/is-guid.decorator';
import {
  DOMINIO_CODIGO_REGEX,
  toCodigoDominio,
  toJsonObject,
} from '../../../utils/dominio.util';

export class CreateDominioRelacionDto {
  @ApiProperty({
    description: 'UUID del valor origen del vínculo.',
    format: 'uuid',
    example: '541de9ac-3b27-4a12-81cf-b2fd83aa6ec7',
  })
  @IsGuid({ message: 'Campo valorOrigenId debe ser un UUID válido.' })
  valorOrigenId!: string;

  @ApiProperty({
    description:
      'UUID del valor destino del vínculo. Debe ser distinto del origen.',
    format: 'uuid',
    example: '8d05ba77-f377-418d-a475-07b0b9603454',
  })
  @IsGuid({ message: 'Campo valorDestinoId debe ser un UUID válido.' })
  valorDestinoId!: string;

  @ApiProperty({
    description:
      'Identificador semántico del tipo de relación. Se guarda en mayúsculas.',
    example: 'MONEDA_HABILITADA',
    maxLength: 50,
  })
  @Transform(toCodigoDominio)
  @IsString({ message: 'Campo tipoRelacion debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo tipoRelacion es obligatorio.' })
  @MaxLength(50, {
    message: 'Campo tipoRelacion no puede exceder 50 caracteres.',
  })
  @Matches(DOMINIO_CODIGO_REGEX, {
    message:
      'Campo tipoRelacion solo admite letras, números, punto (.), guion (-) y guion bajo (_), sin espacios ni comas.',
  })
  tipoRelacion!: string;

  @ApiPropertyOptional({
    description:
      'Objeto JSON con reglas propias de la combinación (se valida el formato JSON).',
    example: { esMonedaBase: true, limiteDiario: 50000 },
    nullable: true,
  })
  @Transform(toJsonObject)
  @IsObject({ message: 'Campo atributos debe ser un objeto JSON.' })
  @IsOptional()
  atributos?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Indica si la relación está vigente.',
    example: true,
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
