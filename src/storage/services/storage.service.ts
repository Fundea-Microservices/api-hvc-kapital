import {
  Injectable,
  Logger,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, ReadStream } from 'fs';
import { FileValidationService } from './file-validation.service';
import { AntivirusService } from './antivirus.service';
import { EntityUpdaterService } from './entity-updater.service';
import { getCategoryConfig } from '../config/category.config';
import { FilenameSanitizer } from '../utils/filename-sanitizer';
import { PathSecurityValidator } from '../validators/path-security.validator';
import {
  parseRangeHeader,
  RangeNotSatisfiableException,
} from '../utils/http-range.util';

interface UploadOptions {
  file: Express.Multer.File;
  categoria: string;
  customName?: string;
  metadata?: Record<string, any>;
  userId?: string;
}

/** Categorías que se sirven inline (visualización en el navegador). */
const INLINE_CATEGORIES = new Set(['perfil', 'producto', 'porcion']);

/** Content-Type por extensión, para no depender de inferencias ambiguas. */
const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

@Injectable()
export class StorageService extends BaseService {
  protected readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly validationService: FileValidationService,
    private readonly antivirusService: AntivirusService,
    private readonly entityUpdater: EntityUpdaterService,
  ) {
    super();
  }

  async uploadFile(options: UploadOptions) {
    const { file, categoria, customName, metadata, userId } = options;

    try {
      const config = getCategoryConfig(categoria);
      if (!config) {
        return this.customThrowError('', 'STG-01-01', 'Categoría inválida');
      }

      if (file.size > config.maxSize) {
        return this.customThrowError(
          '',
          'STG-01-02',
          `Archivo excede tamaño máximo de ${config.maxSize / 1024 / 1024}MB`,
        );
      }

      this.validationService.validateMimeType(file, config.allowedMimeTypes);
      this.validationService.validateExtension(file, config.allowedExtensions);

      await this.validationService.validateMagicNumbers(file);

      if (config.antivirusScan) {
        await this.antivirusService.scanFile(file.path);
      }

      const sanitizedName = customName
        ? FilenameSanitizer.sanitize(customName, false) +
          path.extname(file.originalname)
        : FilenameSanitizer.sanitize(file.originalname);

      const categoryPath = PathSecurityValidator.resolveUploadDir(categoria);
      await fs.mkdir(categoryPath, { recursive: true });
      
      const targetPath = PathSecurityValidator.safeJoin(categoryPath, sanitizedName);
      await fs.copyFile(file.path, targetPath);
      await fs.unlink(file.path);

      const publicUrl = `storage/${categoria}/${sanitizedName}`;

      if (config.entityRelation && userId) {
        await this.entityUpdater.updateEntityUrl({
          categoria,
          entityId: userId,
          fileUrl: publicUrl,
          fieldName: config.entityRelation.field,
        });
      }

      return this.customSuccessResponse(
        {
          fileName: sanitizedName,
          path: targetPath,
          url: publicUrl,
          size: file.size,
          mimeType: file.mimetype,
        },
        metadata,
        HttpStatus.CREATED,
        'Archivo subido exitosamente',
        `storage/upload/${categoria}`,
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (error as { success?: boolean }).success === false
      ) {
        throw error;
      }
      this.customThrowError(error, 'STG-01', 'Error subiendo archivo');
    }
  }

  /**
   * Transmite el archivo por streaming: `fs.createReadStream` +
   * pipe explícito sobre el `Response`, con cabeceras explícitas, soporte
   * `Range`/206/416, `ETag`/304, `HEAD` y aborto del stream si el cliente
   * corta la conexión.
   *
   * El handler del controlador devuelve `void`, nunca el objeto `Response`, así
   * el interceptor global de zona horaria no lo recorre (H1). El consumo de
   * memoria es constante respecto al tamaño del archivo.
   */
  async downloadFile(
    categoria: string,
    fileName: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    let fileSize: number | undefined;

    try {
      if (!getCategoryConfig(categoria)) {
        this.responderError(
          res,
          HttpStatus.NOT_FOUND,
          'STG-02-01',
          'Categoría inválida',
        );
        return;
      }

      const safeName = PathSecurityValidator.validatePath(fileName, categoria);
      const uploadDir = PathSecurityValidator.resolveUploadDir(categoria);
      
      const filePath = PathSecurityValidator.safeJoin(uploadDir, safeName);

      // stat() aporta size y mtime; también confirma que existe y es archivo.
      const stat = await fs.stat(filePath).catch(() => null);
      if (!stat || !stat.isFile()) {
        this.responderError(
          res,
          HttpStatus.NOT_FOUND,
          'STG-02-02',
          'Archivo no encontrado',
        );
        return;
      }
      fileSize = stat.size;

      const ext = path.extname(safeName).toLowerCase();
      const mimeType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
      const etag = `"${stat.size.toString(16)}-${Math.floor(
        stat.mtimeMs,
      ).toString(16)}"`;
      const disposition = INLINE_CATEGORIES.has(categoria)
        ? 'inline'
        : 'attachment';

      // Cabeceras comunes a 200/206/304. safeName ya está restringido a
      // [a-zA-Z0-9._-], por lo que no puede romper el valor entre comillas.
      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${safeName}"`,
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('ETag', etag);
      res.setHeader('Last-Modified', stat.mtime.toUTCString());

      // 304: el cliente ya tiene la versión vigente.
      if (req.headers['if-none-match'] === etag) {
        res.status(HttpStatus.NOT_MODIFIED).end();
        return;
      }

      // HEAD: solo cabeceras, sin abrir el stream.
      if (req.method === 'HEAD') {
        res.setHeader('Content-Length', String(stat.size));
        res.status(HttpStatus.OK).end();
        return;
      }

      const range = parseRangeHeader(req.headers.range, stat.size);

      if (range) {
        res.status(HttpStatus.PARTIAL_CONTENT);
        res.setHeader(
          'Content-Range',
          `bytes ${range.start}-${range.end}/${stat.size}`,
        );
        res.setHeader('Content-Length', String(range.end - range.start + 1));
        this.streamToResponse(
          createReadStream(filePath, { start: range.start, end: range.end }),
          res,
        );
        return;
      }

      res.status(HttpStatus.OK);
      res.setHeader('Content-Length', String(stat.size));
      this.streamToResponse(createReadStream(filePath), res);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error descargando archivo: ${message}`);

      if (res.headersSent) {
        // Ya se escribió parte del cuerpo: no se puede reescribir el status.
        res.destroy();
        return;
      }

      if (error instanceof RangeNotSatisfiableException) {
        if (fileSize !== undefined) {
          res.setHeader('Content-Range', `bytes */${fileSize}`);
        }
        this.responderError(
          res,
          HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
          'STG-02-05',
          error.message,
        );
        return;
      }
      if (error instanceof BadRequestException) {
        this.responderError(
          res,
          HttpStatus.BAD_REQUEST,
          'STG-02-04',
          error.message,
        );
        return;
      }
      if (error instanceof NotFoundException) {
        this.responderError(
          res,
          HttpStatus.NOT_FOUND,
          'STG-02-02',
          'Archivo no encontrado',
        );
        return;
      }
      this.responderError(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'STG-02-03',
        'Error al descargar archivo',
      );
    }
  }

  /**
   * Conecta el ReadStream con la respuesta y libera el descriptor si el cliente
   * corta la conexión (D10).
   */
  private streamToResponse(stream: ReadStream, res: Response): void {
    res.on('close', () => {
      if (!stream.destroyed) stream.destroy();
    });

    stream.on('error', (err) => {
      this.logger.error(`Stream de descarga abortado: ${err.message}`);
      if (res.headersSent) res.destroy();
      else res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
    });

    stream.pipe(res);
  }

  private responderError(
    res: Response,
    status: HttpStatus,
    code: string,
    message: string,
  ): void {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    // Las cabeceras del archivo pueden haberse fijado antes de detectar el
    // error (p. ej. 416, tras el stat y las cabeceras comunes). `res.json()` no
    // sobrescribe un Content-Type ya fijado, así que se limpian para devolver
    // JSON consistente en lugar del MIME del archivo.
    res.removeHeader('Content-Disposition');
    res.removeHeader('Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(status).json({
      success: false,
      statusCode: status.toString(),
      message,
      code,
    });
  }
}
