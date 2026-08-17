import * as path from 'path';

export class FilenameSanitizer {
  static sanitize(filename: string, preserveExtension = true): string {
    let name = filename;
    let ext = '';

    if (preserveExtension) {
      const parsed = path.parse(filename);
      name = parsed.name;
      ext = parsed.ext;
    }

    name = name
      .replace(/[^\w\s-]/g, '') // Solo alfanuméricos, espacios, guiones
      .replace(/\s+/g, '_') // Espacios → underscores
      .replace(/_+/g, '_') // Múltiples underscores → uno
      .replace(/^[._-]+/, '') // Eliminar dots/guiones al inicio
      .replace(/[._-]+$/, '') // Eliminar dots/guiones al final
      .toLowerCase();

    if (name.length > 100) {
      name = name.substring(0, 100);
    }

    const timestamp = Date.now();
    return `${name}-${timestamp}${ext}`;
  }
}
