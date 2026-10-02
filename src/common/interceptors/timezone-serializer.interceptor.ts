import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Zona de presentación de la API. Guatemala no aplica horario de verano, por
 * lo que el offset es siempre UTC−6.
 */
const OFFSET_GUATEMALA = '+00:00';

/**
 * Las columnas de fecha son `datetime` (sin zona) y guardan la hora local de
 * Guatemala. Con `useUTC: true`, el driver entrega un `Date` cuyos componentes
 * UTC son exactamente esa hora de pared (p. ej. BD `10:30` → `10:30Z`), pero
 * *no* un instante UTC real. Por eso se formatea en UTC (para no volver a
 * desplazar la hora) y se le anexa el offset real de Guatemala. El resultado
 * (`2026-09-16T10:30:00-06:00`) es un instante absoluto válido que además
 * muestra el mismo reloj que la base de datos.
 *
 * Se asume que toda instancia de `Date` de la respuesta proviene de una
 * columna `datetime` local. Los timestamps de log/respuesta ya se construyen
 * como string y no pasan por aquí.
 */
function serializarFechas(valor: unknown): unknown {
  if (valor === null || valor === undefined) return valor;

  if (valor instanceof Date) {
    return `${dayjs(valor).utc().format('YYYY-MM-DDTHH:mm:ss')}${OFFSET_GUATEMALA}`;
  }

  if (Array.isArray(valor)) {
    return valor.map((item) => serializarFechas(item));
  }

  // No clonar tipos binarios ni estructuras no serializables.
  if (valor instanceof Buffer || valor instanceof Uint8Array) return valor;

  if (typeof valor === 'object') {
    const resultado: Record<string, unknown> = {};
    for (const clave of Object.keys(valor as Record<string, unknown>)) {
      resultado[clave] = serializarFechas(
        (valor as Record<string, unknown>)[clave],
      );
    }
    return resultado;
  }

  return valor;
}

/**
 * Interceptor global que normaliza la zona horaria de todas las fechas de la
 * respuesta. Centraliza el formato en un único punto, sin tocar la base de
 * datos ni las entidades.
 */
@Injectable()
export class TimezoneSerializerInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => serializarFechas(data)));
  }
}
