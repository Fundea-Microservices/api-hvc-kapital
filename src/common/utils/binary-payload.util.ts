import { StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';

/**
 * Detecta payloads binarios o de streaming que NO deben pasar por la cadena de
 * serialización global (`ClassSerializerInterceptor` / interceptor de zona
 * horaria). Al transformarlos se corrompen (un stream se convierte en un objeto
 * plano y deja de ser reconocido como archivo) o lanzan
 * (`classToPlain` sobre un `StreamableFile`).
 *
 * Se centraliza aquí para que todos los interceptores globales apliquen
 * exactamente la misma guarda (D5 de la estrategia de descarga por streaming).
 */
export function isBinaryPayload(value: unknown): boolean {
  return (
    value instanceof StreamableFile ||
    Buffer.isBuffer(value) ||
    value instanceof Uint8Array ||
    value instanceof Readable
  );
}
