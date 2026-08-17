import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Res,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Catch() // <-- sin argumento: captura cualquier excepción
export class HttpCustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    // Logger genérico

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number;
    let message: any;
    let stack: string = 'N/A';

    // Caso 1: Errores HTTP lanzados explícitamente (throw new HttpException(...))
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      // Puede ser string o un objeto
      message = typeof res === 'string' ? res : (res as any).message || res;
    }

    // Caso 2: Errores de JS, Base de Datos o errores inesperados (Uncontrolled)
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      // IMPORTANTE: No enviamos exception.message al cliente
      message = 'Ha ocurrido un error interno en el servidor';
      stack = exception.stack || 'N/A';
    }

    // Caso 3: Errores lanzados como objetos (ej. desde BaseService)
    else {
      status = exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

      // Si el status es >= 500, ocultamos el mensaje por seguridad
      if (status >= 500) {
        message = 'Error de procesamiento interno';
      } else {
        // Para errores 4xx (negocio), permitimos el mensaje
        message = exception.message || 'Solicitud incorrecta';
      }
    }

    const logger = new Logger('HTTPExceptionFilter');

    // Log detallado para el SOC/Desarrolladores (Interno)
    const logDetail = {
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: dayjs().tz('America/Guatemala').format('DD/MM/YYYY HH:mm:ss'),
      message: exception.message || message, // Aquí sí guardamos el error real
      stack: stack !== 'N/A' ? stack : undefined,
      user: request.user ? request.user.userName : 'Anonymous',
    };

    logger.error(
      `[${status}] ${request.method} ${request.url} - Error: ${logDetail.message}`,
      stack !== 'N/A' ? stack : '',
    );

    // Respuesta sanitizada para el Cliente (Externo)
    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: logDetail.timestamp,
      message: message, // Este mensaje es el que ya sanitizamos arriba
    });
  }
}
