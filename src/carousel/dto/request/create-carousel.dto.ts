import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

/** Lista de códigos separados por coma, sin espacios. Ej: "admin1,jperez". */
const USUARIOS_REGEX = /^[^,\s]+(,[^,\s]+)*$/;

/**
 * Normaliza la lista de usuarios: quita espacios y entradas vacías.
 * Cadena vacía o null → null (visible para todos).
 */
const toUsuariosList = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  const limpio = value
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
    .join(',');
  return limpio === '' ? null : limpio;
};

export class CreateCarouselDto {
  @ApiProperty({
    description: 'Título principal del elemento del carrusel.',
    example: 'Nueva tasa preferencial',
    maxLength: 200,
  })
  @IsString({ message: 'Campo titulo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo titulo es obligatorio.' })
  @MaxLength(200, { message: 'Campo titulo no puede exceder 200 caracteres.' })
  titulo!: string;

  @ApiPropertyOptional({
    description: 'Subtítulo o bajada del elemento.',
    example: 'Solo durante noviembre',
    maxLength: 200,
  })
  @IsString({ message: 'Campo subtitulo debe ser una cadena de texto.' })
  @MaxLength(200, {
    message: 'Campo subtitulo no puede exceder 200 caracteres.',
  })
  @IsOptional()
  subtitulo?: string | null;

  @ApiPropertyOptional({
    description: 'Código interno opcional para identificar el elemento.',
    example: 'PROMO-NOV',
    maxLength: 20,
  })
  @IsString({ message: 'Campo codigo debe ser una cadena de texto.' })
  @MaxLength(20, { message: 'Campo codigo no puede exceder 20 caracteres.' })
  @IsOptional()
  codigo?: string | null;

  @ApiPropertyOptional({
    description: 'Texto descriptivo largo de la noticia o promoción.',
    example: 'Aprovecha la tasa preferencial en créditos personales.',
  })
  @IsString({ message: 'Campo descripcion debe ser una cadena de texto.' })
  @IsOptional()
  descripcion?: string | null;

  @ApiPropertyOptional({
    description:
      'Ruta o URL de la imagen. Obligatoria al crear si no se adjunta el archivo `file`; ' +
      'si se adjunta, se ignora y se usa la ruta del archivo subido. ' +
      'Para cambiar la imagen de un elemento existente use PUT /config/carousel/{id}/imagen.',
    example: 'storage/carousel/promo_noviembre-1794211200000.jpg',
  })
  @IsString({ message: 'Campo fotoUrl debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'Campo fotoUrl no puede estar vacío.' })
  @IsOptional()
  fotoUrl?: string;

  @ApiPropertyOptional({
    description:
      'Destino al pulsar el elemento. Ruta interna si esExterno = false, URL completa si esExterno = true.',
    example: '/creditos/personales',
  })
  @IsString({ message: 'Campo redireccionUrl debe ser una cadena de texto.' })
  @IsOptional()
  redireccionUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Posición en el carrusel (menor = primero).',
    example: 1,
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'Campo orden debe ser un número entero.' })
  @Min(0, { message: 'Campo orden no puede ser negativo.' })
  @IsOptional()
  orden?: number;

  @ApiPropertyOptional({
    description: 'Indica si el elemento se muestra en la web.',
    example: true,
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo visibleWeb debe ser un valor booleano.' })
  @IsOptional()
  visibleWeb?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el elemento se muestra en la app móvil.',
    example: true,
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo visibleApp debe ser un valor booleano.' })
  @IsOptional()
  visibleApp?: boolean;

  @ApiPropertyOptional({
    description:
      'Códigos de usuario separados por coma que pueden ver el elemento. Vacío o null = todos los usuarios.',
    example: 'admin1,jperez',
    maxLength: 300,
    nullable: true,
  })
  @Transform(toUsuariosList)
  @IsString({ message: 'Campo usuarios debe ser una cadena de texto.' })
  @MaxLength(300, {
    message: 'Campo usuarios no puede exceder 300 caracteres.',
  })
  @Matches(USUARIOS_REGEX, {
    message: 'Campo usuarios debe ser una lista de códigos separados por coma.',
  })
  @IsOptional()
  usuarios?: string | null;

  @ApiPropertyOptional({
    description: 'Texto del botón de acción.',
    example: 'Ver más',
    maxLength: 50,
  })
  @IsString({ message: 'Campo textoBoton debe ser una cadena de texto.' })
  @MaxLength(50, {
    message: 'Campo textoBoton no puede exceder 50 caracteres.',
  })
  @IsOptional()
  textoBoton?: string | null;

  @ApiPropertyOptional({
    description:
      'Fecha y hora desde la que se muestra el elemento. Null = sin límite.',
    example: '2026-11-01T00:00:00',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @Type(() => Date)
  @IsDate({ message: 'Campo fechaInicio debe ser una fecha válida.' })
  @IsOptional()
  fechaInicio?: Date | null;

  @ApiPropertyOptional({
    description:
      'Fecha y hora hasta la que se muestra el elemento. Null = sin límite.',
    example: '2026-11-30T23:59:59',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @Type(() => Date)
  @IsDate({ message: 'Campo fechaFin debe ser una fecha válida.' })
  @IsOptional()
  fechaFin?: Date | null;

  @ApiPropertyOptional({
    description:
      'Si es true, redireccionUrl se abre en el navegador; si es false, es una ruta interna.',
    example: false,
    default: false,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo esExterno debe ser un valor booleano.' })
  @IsOptional()
  esExterno?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el elemento está activo.',
    example: true,
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'Campo activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
