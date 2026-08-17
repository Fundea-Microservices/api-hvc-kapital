import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export abstract class BaseService {
  protected abstract readonly logger: Logger;

  /**
   * Maneja errores personalizados
   * @param error Error capturado
   * @param messageCode Código del mensaje de error
   * @param messageError Mensaje de error
   */
  protected customThrowError(
    error: any,
    messageCode: string,
    messageError: string,
  ): never {
    // Si es otro error (por ejemplo, del ORM), lo envolvemos
    const errorMessage = `(${messageCode}) ${messageError}`;
    this.logger.error(errorMessage, error?.stack || error);

    // Si el error ya tiene un mensaje con código de error, solo lo propagamos
    if (
      error &&
      typeof error === 'object' &&
      error.message &&
      error.message.includes('(')
    ) {
      throw error;
    }

    // Si el error ya tiene estructura de respuesta personalizada, lo propagamos
    if (
      error &&
      typeof error === 'object' &&
      error.statusCode &&
      error.success === false
    ) {
      throw error;
    }

    // Si hay un error específico y tiene información útil, lo agregamos al mensaje
    let detailedMessage = errorMessage;
    if (error && error.message && !error.message.includes('(')) {
      detailedMessage += `: ${error.message}`;
    } else if (error && typeof error === 'string' && error.trim() !== '') {
      detailedMessage += `: ${error}`;
    }

    throw {
      statusCode: HttpStatus.BAD_REQUEST,
      message: detailedMessage,
      success: false,
    };
  }

  /**
   * Convierte recursivamente todos los objetos Date a horario de Guatemala
   */
  private convertDatesToGuatemala(data: any): any {
    if (data === null || data === undefined) return data;
    if (data instanceof Date) {
      return dayjs(data).tz('America/Guatemala').format('YYYY-MM-DDTHH:mm:ss');
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.convertDatesToGuatemala(item));
    }
    if (typeof data === 'object') {
      const result: any = {};
      for (const key of Object.keys(data)) {
        result[key] = this.convertDatesToGuatemala(data[key]);
      }
      return result;
    }
    return data;
  }

  /**
   * Maneja respuestas de éxito personalizadas
   * @param data Datos a retornar
   * @param metadata Metadatos adicionales
   * @param statusCode Código de estado HTTP
   * @param message Mensaje de éxito
   * @param path Ruta del endpoint
   * @returns Objeto con formato de respuesta exitosa
   */
  protected customSuccessResponse(
    data: any,
    metadata: any = null,
    statusCode: number | string = HttpStatus.OK,
    message: string = 'Operación exitosa',
    path: string = 'N/A',
  ) {
    const moment = dayjs()
      .tz('America/Guatemala')
      .format('DD/MM/YYYY HH:mm:ss');
    // Log de la operación exitosa
    this.logger.log({
      label: 'SUCCESS RESPONSE',
      statusCode: statusCode,
      path: path,
      timestamp: moment,
      message: message,
    });

    return {
      success: true,
      statusCode:
        typeof statusCode === 'string' ? statusCode : statusCode.toString(),
      path: path,
      timestamp: moment,
      message: message,
      data: this.convertDatesToGuatemala(data),
      metadata,
    };
  }
}
