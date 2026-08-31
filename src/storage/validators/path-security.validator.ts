import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { getCategoryConfig } from '../config/category.config';

export class PathSecurityValidator {
  // Sin flag /g de forma deliberada: RegExp.test() sobre un regex global muta
  // lastIndex y, al ser estos patrones estáticos compartidos entre peticiones,
  // el filtro alternaba entre bloquear y dejar pasar la misma entrada.
  private static readonly DANGEROUS_PATTERNS = [
    /\.\./, // .. (estándar)
    /\.%2e/i, // .%2e (encoded)
    /%2e\./i, // %2e. (encoded)
    /%2e%2e/i, // %2e%2e (fully encoded)
    /\0/, // null bytes
    /[<>:"|?*]/, // caracteres ilegales Windows
    /^[/\\]+/, // absolute paths
    /[/\\]{2,}/, // múltiples separadores
  ];

  private static readonly ALLOWED_NAME = /^[a-zA-Z0-9._-]+$/;
  private static readonly MAX_NAME_LENGTH = 255;

  /**
   * Resuelve el directorio de una categoría validándola antes contra el
   * catálogo, para que ningún valor del cliente llegue a path.resolve sin
   * comprobar.
   */
  static resolveUploadDir(category: string): string {
    if (!getCategoryConfig(category)) {
      throw new BadRequestException('Categoría inválida');
    }
    return path.resolve(process.cwd(), 'uploads', category);
  }

  /**
   * Valida el nombre de archivo recibido del cliente y devuelve un nombre
   * plano, sin componentes de directorio, seguro para concatenar al directorio
   * de la categoría.
   */
  static validatePath(filePath: string, category: string): string {
    let decoded: string;
    try {
      decoded = decodeURIComponent(filePath);
    } catch {
      // decodeURIComponent lanza URIError con secuencias mal formadas ("%",
      // "%zz"); sin capturarlo la petición terminaba en un 500.
      throw new BadRequestException('Nombre de archivo mal codificado');
    }

    decoded = path.normalize(decoded);

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(decoded)) {
        // El valor recibido no se refleja en el mensaje: evita usar la
        // respuesta de error como oráculo y como vector de log injection.
        throw new BadRequestException('Ruta inválida detectada');
      }
    }

    // basename() descarta cualquier componente de directorio que hubiese
    // sobrevivido a las comprobaciones anteriores. Si el nombre cambia es que
    // traía separadores, y se rechaza en lugar de aceptarlo recortado.
    const fileName = path.basename(decoded);

    if (fileName !== decoded || !this.ALLOWED_NAME.test(fileName)) {
      throw new BadRequestException(
        'El nombre de archivo contiene caracteres no permitidos',
      );
    }

    if (fileName.length > this.MAX_NAME_LENGTH) {
      throw new BadRequestException('Nombre de archivo demasiado largo');
    }

    // Comprobación final de contención. Llegados aquí fileName ya es un nombre
    // plano validado contra la allowlist, pero se mantiene como última capa.
    const uploadDir = this.resolveUploadDir(category);
    const targetPath = path.resolve(uploadDir, fileName);

    if (!targetPath.startsWith(uploadDir + path.sep)) {
      throw new BadRequestException('Intento de path traversal detectado');
    }

    return fileName;
  }
}
