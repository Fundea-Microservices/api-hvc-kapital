import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class FileLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('FileOperations');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const file = request.file;
    const categoria = request.params.categoria;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log({
            operation: method === 'POST' ? 'UPLOAD' : 'DOWNLOAD',
            categoria,
            fileName: file?.originalname || request.params.fileName,
            fileSize: file?.size,
            userId: user?.id,
            duration: `${duration}ms`,
            success: true,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            operation: method === 'POST' ? 'UPLOAD' : 'DOWNLOAD',
            categoria,
            fileName: file?.originalname || request.params.fileName,
            userId: user?.id,
            duration: `${duration}ms`,
            success: false,
            error: error.message,
          });
        },
      }),
    );
  }
}
