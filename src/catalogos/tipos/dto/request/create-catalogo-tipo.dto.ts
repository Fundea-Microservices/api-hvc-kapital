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
import {
  CATALOGO_CODIGO_REGEX,
  toCodigoCatalogo,
  toJsonObject,
} from '../../../utils/catalogo.util';

export class CreateCatalogoTipoDto {
  @ApiProperty({
    description:
      'Código único del catálogo. Se guarda en mayúsculas; solo letras, números, punto, guion y guion bajo.',
    example: 'PAIS',
    maxLength: 50,
  })
  @Transform(toCodigoCatalogo)
  @IsString({ message: 'Campo codigo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo codigo es obligatorio.' })
  @MaxLength(50, { message: 'Campo codigo no puede exceder 50 caracteres.' })
  @Matches(CATALOGO_CODIGO_REGEX, {
    message:
      'Campo codigo solo admite letras, números, punto (.), guion (-) y guion bajo (_), sin espacios ni comas.',
  })
  codigo!: string;

  @ApiProperty({
    description: 'Nombre descriptivo del catálogo.',
    example: 'Países del Sistema',
    maxLength: 100,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo nombre es obligatorio.' })
  @MaxLength(100, { message: 'Campo nombre no puede exceder 100 caracteres.' })
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Detalle del uso y alcance del catálogo.',
    example: 'Catálogo de países disponibles para la operación',
    maxLength: 255,
    nullable: true,
  })
  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @MaxLength(255, {
    message: 'Campo descripcion no puede exceder 255 caracteres.',
  })
  @IsOptional()
  descripcion?: string | null;

  @ApiPropertyOptional({
    description:
      'Habilita la jerarquía (padreId) para los ítems del catálogo. Ejemplo: DEPARTAMENTO depende de PAIS.',
    example: false,
    default: false,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo permiteJerarquia debe ser un booleano.' })
  @IsOptional()
  permiteJerarquia?: boolean;

  @ApiPropertyOptional({
    description:
      'JSON Schema opcional que documenta/valida la estructura de CatalogoItem.atributos.',
    example: { type: 'object', properties: { simbolo: { type: 'string' } } },
    nullable: true,
  })
  @Transform(toJsonObject)
  @IsObject({ message: 'Campo esquemaAtributos debe ser un objeto JSON.' })
  @IsOptional()
  esquemaAtributos?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Indica si el catálogo está habilitado operativamente.',
    example: true,
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
