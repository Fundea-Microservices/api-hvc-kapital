import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { MagicNumberValidator } from '../validators/magic-number.validator';

@Injectable()
export class FileValidationService {
  validateMimeType(file: Express.Multer.File, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`,
      );
    }
  }

  validateExtension(
    file: Express.Multer.File,
    allowedExtensions: string[],
  ): void {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Extensión no permitida. Permitidas: ${allowedExtensions.join(', ')}`,
      );
    }
  }

  async validateMagicNumbers(file: Express.Multer.File): Promise<void> {
    await MagicNumberValidator.validate(file);
  }
}
