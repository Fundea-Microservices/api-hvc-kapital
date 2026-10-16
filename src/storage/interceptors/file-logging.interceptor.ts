import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface FileOperationRequest extends Request {
  user?: { id?: string };
  file?: Express.Multer.File;
}

@Injectable()
export class FileLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('FileOperations');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<FileOperationRequest>();
    const response = http.getResponse<Response>();
    const { method, user, file } = request;
    const categoria = request.params?.categoria;
    const fileName = file?.originalname || request.params?.fileName;

    const startTime = Date.now();
    let logged = false;

    // La duración relevante es la de la transferencia, no la del retorno del
    // handler: en una descarga, el `next` de `tap` se dispara al preparar las
    // cabeceras y el envío del stream continúa después (H2).
    const emit = (success: boolean, error?: string) => {
      if (logged) return;
      logged = true;

      const payload = {
        operation: method === 'POST' ? 'UPLOAD' : 'DOWNLOAD',
        categoria,
        fileName,
        fileSize: file?.size,
        userId: user?.id,
        statusCode: response.statusCode,
        duration: `${Date.now() - startTime}ms`,
        success,
        ...(error ? { error } : {}),
      };

      if (success) this.logger.log(payload);
      else this.logger.error(payload);
    };

    // `finish` = la respuesta se envió por completo (incluye el stream).
    response.on('finish', () => emit(true));
    // `close` sin `finish` = el cliente cortó la conexión a mitad del envío.
    response.on('close', () => emit(false, 'Conexión cerrada por el cliente'));

    return next.handle().pipe(
      tap({
        error: (error: Error) => emit(false, error.message),
      }),
    );
  }
}
