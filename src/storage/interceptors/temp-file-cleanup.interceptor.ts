import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/**
 * Borra el temporal que multer dejó en uploads/temp cuando la petición
 * termina sin haberlo consumido (UUID inválido, body inválido, error de
 * negocio...). Si StorageService ya movió el archivo, el unlink da ENOENT
 * y se ignora.
 *
 * Debe declararse ANTES de FileInterceptor para envolverlo:
 *   @UseInterceptors(TempFileCleanupInterceptor, FileInterceptor('file'))
 */
@Injectable()
export class TempFileCleanupInterceptor implements NestInterceptor {
  private readonly logger = new Logger('TempFileCleanup');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<{ file?: Express.Multer.File }>();

    return next.handle().pipe(
      finalize(() => {
        const tempPath = request.file?.path;
        if (!tempPath) return;
        fs.unlink(tempPath).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') {
            this.logger.warn(
              `No se pudo eliminar el temporal ${tempPath}: ${error.message}`,
            );
          }
        });
      }),
    );
  }
}
