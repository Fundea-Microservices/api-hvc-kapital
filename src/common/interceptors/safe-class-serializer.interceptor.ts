import {
  ClassSerializerInterceptor,
  Injectable,
  ExecutionContext,
  CallHandler,
  PlainLiteralObject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isBinaryPayload } from '../utils/binary-payload.util';

/**
 * Variante del `ClassSerializerInterceptor` nativo que conserva el
 * comportamiento global (serializar entidades con `@Exclude`/`@Expose`), pero
 * excluye los payloads binarios/streams antes de pasarlos por
 * `class-transformer`.
 *
 * El `serialize` de Nest ya ignora valores no-objeto y `StreamableFile`, pero
 * no protege `Buffer`/`Readable` (los convertiría en un objeto plano). Esta
 * guarda, compartida con el interceptor de zona horaria, cierra ese hueco sin
 * afectar al resto de controladores.
 */
@Injectable()
export class SafeClassSerializerInterceptor extends ClassSerializerInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        // Los payloads binarios/streams no se serializan.
        if (isBinaryPayload(data)) {
          return data;
        }

        const options = this.getContextOptions(context) ?? {};

        // Si no es binario, se ejecuta la serialización global original.
        return this.serialize(data as PlainLiteralObject, options);
      }),
    );
  }
}
