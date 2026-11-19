import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';
import { IsGuid } from 'src/common/validators/is-guid.decorator';
import {
  CATALOGO_CODIGO_REGEX,
  toCodigoCatalogo,
  toJsonObject,
} from '../../../utils/catalogo.util';

export class CreateCatalogoItemDto {
  @ApiProperty({
    description: 'UUID del catálogo (CatalogoTipo) al que pertenece el ítem.',
    format: 'uuid',
    example: '3f46a1f3-1b4d-4b28-bc23-6f1c7ab9e67d',
  })
  @IsGuid({ message: 'Campo catalogoTipoId debe ser un UUID válido.' })
  catalogoTipoId!: string;

  @ApiPropertyOptional({
    description:
      'UUID del ítem padre. Solo válido si el catálogo tiene permiteJerarquia = true y el padre pertenece al mismo catálogo.',
    format: 'uuid',
    nullable: true,
    example: null,
  })
  @IsGuid({ message: 'Campo padreId debe ser un UUID válido.' })
  @IsOptional()
  padreId?: string | null;

  @ApiProperty({
    description:
      'Código único dentro del mismo catálogo. Se guarda en mayúsculas.',
    example: 'GT',
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
    description: 'Nombre principal del ítem.',
    example: 'Guatemala',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Campo nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo nombre es obligatorio.' })
  @MaxLength(150, { message: 'Campo nombre no puede exceder 150 caracteres.' })
  nombre!: string;

  @ApiProperty({
    description: 'Valor estandarizado u operativo del ítem.',
    example: '502',
    maxLength: 255,
  })
  @IsString({ message: 'Campo valor debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo valor es obligatorio.' })
  @MaxLength(255, { message: 'Campo valor no puede exceder 255 caracteres.' })
  valor!: string;

  @ApiPropertyOptional({
    description: 'Orden de despliegue en listas y selectores.',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'Campo orden debe ser un número entero.' })
  @Min(0, { message: 'Campo orden no puede ser negativo.' })
  @IsOptional()
  orden?: number;

  @ApiPropertyOptional({
    description:
      'Objeto JSON con propiedades extendidas del dominio (se valida el formato JSON).',
    example: { codigoTelefono: '+502', iso3: 'GTM' },
    nullable: true,
  })
  @Transform(toJsonObject)
  @IsObject({ message: 'Campo atributos debe ser un objeto JSON.' })
  @IsOptional()
  atributos?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Indica si el ítem está activo para nuevas operaciones.',
    example: true,
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
