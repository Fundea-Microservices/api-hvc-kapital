import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isGuid } from '../validators/is-guid.decorator';

/**
 * Reemplazo de `ParseUUIDPipe` para parámetros de ruta con ids de la BD.
 * Acepta cualquier GUID 8-4-4-4-12 (ver `isGuid`), sin validar versión/variante.
 */
@Injectable()
export class ParseGuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isGuid(value)) {
      throw new BadRequestException('Validation failed (uuid is expected)');
    }
    return value;
  }
}
