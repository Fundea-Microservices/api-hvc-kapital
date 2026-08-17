import { LoggerService, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    // Formato personalizado para el archivo (Texto plano limpio)
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, context, stack }) => {
        // Si el mensaje es un objeto, lo serializamos
        const msg = typeof message === 'object' ? JSON.stringify(message) : message;
        // El contexto de NestJS (ej: [RoutesResolver])
        const ctx = context ? `[${context}] ` : '';
        // El stack trace si existe
        const s = stack ? `\n${stack}` : '';
        
        return `[${timestamp}] ${level.toUpperCase()}: ${ctx}${msg}${s}`;
      }),
    );

    this.logger = winston.createLogger({
      level: 'info',
      format: fileFormat,
      transports: [
        // 💾 Solo archivo rotativo, sin consola
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'logs-api-%DATE%.txt',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '10m',
          maxFiles: '90d',
        }),
      ],
    });
  }

  // NestJS envía (message, context) o (message, ...meta)
  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, stack?: string, context?: string) {
    // NestJS a veces envía el contexto como segundo o tercer argumento
    const ctx = context || (typeof stack === 'string' && !stack.includes('\n') ? stack : undefined);
    this.logger.error(message, { stack, context: ctx });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
