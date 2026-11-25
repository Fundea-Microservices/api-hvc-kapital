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
  DOMINIO_CODIGO_REGEX,
  toCodigoDominio,
  toJsonObject,
} from '../../../utils/dominio.util';

export class CreateDominioValorDto {
  @ApiProperty({
    description: 'UUID del dominio al que pertenece el valor.',
    format: 'uuid',
    example: '3f46a1f3-1b4d-4b28-bc23-6f1c7ab9e67d',
  })
  @IsGuid({ message: 'Campo dominioId debe ser un UUID válido.' })
  dominioId!: string;

  @ApiPropertyOptional({
    description:
      'UUID del valor padre. Solo válido si el dominio tiene permiteJerarquia = true y el padre pertenece al mismo dominio.',
    format: 'uuid',
    nullable: true,
    example: null,
  })
  @IsGuid({ message: 'Campo padreId debe ser un UUID válido.' })
  @IsOptional()
  padreId?: string | null;

  @ApiProperty({
    description: 'Código único dentro del mismo dominio. Se guarda en mayúsculas.',
    example: 'GT',
    maxLength: 50,
  })
  @Transform(toCodigoDominio)
  @IsString({ message: 'Campo codigo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo codigo es obligatorio.' })
  @MaxLength(50, { message: 'Campo codigo no puede exceder 50 caracteres.' })
  @Matches(DOMINIO_CODIGO_REGEX, {
    message:
      'Campo codigo solo admite letras, números, punto (.), guion (-) y guion bajo (_), sin espacios ni comas.',
  })
  codigo!: string;

  @ApiProperty({
    description: 'Nombre principal del valor.',
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
    description: 'Valor estandarizado u operativo del dominio.',
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
  @IsInt({ message: 'Campo ordenMenu debe ser un número entero.' })
  @Min(0, { message: 'Campo ordenMenu no puede ser negativo.' })
  @IsOptional()
  ordenMenu?: number;

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
    description: 'Indica si el valor está activo para nuevas operaciones.',
    example: true,
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
