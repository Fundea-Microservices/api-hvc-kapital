import { HttpException, HttpStatus } from '@nestjs/common';

export interface ByteRange {
  start: number;
  end: number;
}

/**
 * 416 Requested Range Not Satisfiable. Se modela como excepción propia (en vez
 * de `BadRequestException`) para que el servicio pueda distinguirla sin
 * inspeccionar el texto del mensaje.
 */
export class RangeNotSatisfiableException extends HttpException {
  constructor(message = 'Rango insatisfacible') {
    super(message, HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
  }
}

/**
 * Parsea la cabecera `Range` de una petición HTTP para un archivo de `size`
 * bytes.
 *
 * - Devuelve `null` si no hay cabecera (el llamador sirve el archivo completo).
 * - Soporta el rango `bytes=start-end` y el sufijo `bytes=-N` (últimos N bytes).
 * - Rechaza con 416 los rangos sintácticamente inválidos, los multi-rango
 *   (`bytes=0-1,5-6`) y los insatisfacibles (fuera del tamaño del archivo).
 */
export function parseRangeHeader(
  header: string | undefined,
  size: number,
): ByteRange | null {
  if (!header) return null;

  // Solo se admite un único rango: el multi-rango no lo pide el frontend y
  // complica la respuesta (multipart/byteranges).
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) {
    throw new RangeNotSatisfiableException('Rango no soportado');
  }

  const [, rawStart, rawEnd] = match;

  if (rawStart === '' && rawEnd === '') {
    throw new RangeNotSatisfiableException('Rango inválido');
  }

  let start: number;
  let end: number;

  if (rawStart === '') {
    // Suffix range: últimos N bytes.
    const suffix = Number(rawEnd);
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === '' ? size - 1 : Number(rawEnd);
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start > end ||
    start >= size
  ) {
    throw new RangeNotSatisfiableException('Rango insatisfacible');
  }

  return { start, end: Math.min(end, size - 1) };
}
