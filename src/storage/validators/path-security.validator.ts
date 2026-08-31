import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { getCategoryUploadDir } from '../config/category.config';

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
  private static readonly ONLY_DOTS = /^[.]+$/;
  private static readonly MAX_NAME_LENGTH = 255;

  /**
   * Resuelve el directorio de una categoría validándola antes contra el
   * catálogo, para que ningún valor del cliente llegue a path.resolve sin
   * comprobar.
   */
  static resolveUploadDir(category: string): string {
    // Búsqueda en un mapa fijado al cargar el módulo: la categoría recibida
    // solo selecciona una ruta ya construida, nunca participa en armarla.
    const uploadDir = getCategoryUploadDir(category);
    if (!uploadDir) {
      throw new BadRequestException('Categoría inválida');
    }
    return uploadDir;
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

    // La allowlist admite el punto, así que "." y ".." la superarían. Se
    // rechazan aquí de forma explícita en lugar de depender de la contención.
    if (this.ONLY_DOTS.test(fileName)) {
      throw new BadRequestException('Nombre de archivo inválido');
    }

    if (fileName.length > this.MAX_NAME_LENGTH) {
      throw new BadRequestException('Nombre de archivo demasiado largo');
    }

    const uploadDir = this.resolveUploadDir(category);
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const targetPath = path.resolve(uploadDir, fileName);

    if (!targetPath.startsWith(uploadDir + path.sep)) {
      throw new BadRequestException('Intento de path traversal detectado');
    }

    return fileName;
  }
}
