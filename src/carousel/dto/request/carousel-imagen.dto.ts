// Clases solo para documentación Swagger (multipart/form-data). El archivo
// lo procesa multer (FileInterceptor), no el ValidationPipe.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCarouselDto } from './create-carousel.dto';

const DESCRIPCION_ARCHIVO =
  'Imagen del carrusel. Formatos: JPG/JPEG, PNG, WEBP, GIF. Máximo 5MB.';

/** Body de POST /config/carrusel cuando se envía como multipart. */
export class CreateCarouselMultipartDto extends CreateCarouselDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: `${DESCRIPCION_ARCHIVO} Si se envía, reemplaza a fotoUrl.`,
  })
  file?: unknown;
}

/** Body de PUT /config/carrusel/:id/imagen. */
export class CarouselImagenDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: DESCRIPCION_ARCHIVO,
  })
  file!: unknown;
}
