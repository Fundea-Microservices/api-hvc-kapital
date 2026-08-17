import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export class PathSecurityValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /\.\./g, // .. (estándar)
    /\.%2e/gi, // .%2e (encoded)
    /%2e\./gi, // %2e. (encoded)
    /%2e%2e/gi, // %2e%2e (fully encoded)
    /\0/g, // null bytes
    /[<>:"|?*]/g, // caracteres ilegales Windows
    /^\/+/, // absolute paths
    /\/{2,}/g, // múltiples slashes
  ];

  static validatePath(filePath: string, category: string): string {
    let decoded = decodeURIComponent(filePath);
    decoded = path.normalize(decoded);

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(decoded)) {
        throw new BadRequestException(`Ruta inválida detectada: ${filePath}`);
      }
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(decoded)) {
      throw new BadRequestException(
        'El nombre de archivo contiene caracteres no permitidos',
      );
    }

    if (decoded.length > 255) {
      throw new BadRequestException('Nombre de archivo demasiado largo');
    }

    const uploadDir = path.resolve(process.cwd(), 'uploads', category);
    const targetPath = path.resolve(uploadDir, decoded);

    if (!targetPath.startsWith(uploadDir + path.sep)) {
      throw new BadRequestException('Intento de path traversal detectado');
    }

    return decoded;
  }
}
