import { Injectable, Logger, HttpStatus, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/common/services/base.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FileValidationService } from './file-validation.service';
import { AntivirusService } from './antivirus.service';
import { EntityUpdaterService } from './entity-updater.service';
import { CATEGORY_CONFIG } from '../config/category.config';
import { FilenameSanitizer } from '../utils/filename-sanitizer';
import { PathSecurityValidator } from '../validators/path-security.validator';

interface UploadOptions {
  file: Express.Multer.File;
  categoria: string;
  customName?: string;
  metadata?: Record<string, any>;
  userId?: string;
}

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
      const config = CATEGORY_CONFIG[categoria];
      if (!config) {
        return this.customThrowError(
          '',
          'STG-01-01',
          `Categoría inválida: ${categoria}`,
        );
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

      const categoryPath = path.join(process.cwd(), 'uploads', categoria);
      await fs.mkdir(categoryPath, { recursive: true });

      const targetPath = path.join(categoryPath, sanitizedName);
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
      if (error?.success === false) throw error;
      this.customThrowError(error, 'STG-01', 'Error subiendo archivo');
    }
  }

  async downloadFile(categoria: string, fileName: string, res: Response) {
    try {
      if (!CATEGORY_CONFIG[categoria]) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND.toString(),
          message: `Categoría inválida: ${categoria}`,
          code: 'STG-02-01',
        });
      }

      const safePath = PathSecurityValidator.validatePath(fileName, categoria);

      const fullPath = path.join(process.cwd(), 'uploads', categoria, safePath);

      try {
        await fs.access(fullPath);
      } catch {
        throw new NotFoundException('Archivo no encontrado');
      }

      return res.sendFile(fullPath);
    } catch (error) {
      this.logger.error(`Error descargando archivo: ${error.message}`);
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND.toString(),
          message: 'Archivo no encontrado',
          code: 'STG-02-02',
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR.toString(),
        message: 'Error al descargar archivo',
        code: 'STG-02-03',
      });
    }
  }
}
