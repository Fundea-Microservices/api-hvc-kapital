import * as path from 'path';

export interface CategoryConfig {
  maxSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  requiresAuth: boolean;
  requiresAdmin: boolean;
  antivirusScan: boolean;
  entityRelation?: {
    entity: string;
    field: string;
  };
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  perfil: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg'],
    allowedExtensions: ['.png', '.jpg', '.jpeg'],
    requiresAuth: true,
    requiresAdmin: false,
    antivirusScan: false,
    entityRelation: { entity: 'Usuario', field: 'fotoUrl' },
  },
  producto: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
    requiresAuth: true,
    requiresAdmin: true,
    antivirusScan: false,
    entityRelation: { entity: 'Producto', field: 'fotoUrl' },
  },
  porcion: {
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
    requiresAuth: true,
    requiresAdmin: false,
    antivirusScan: false,
    entityRelation: { entity: 'Producto', field: 'fotoUrl' },
  },
  solicitud: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
    requiresAuth: true,
    requiresAdmin: false,
    antivirusScan: true,
  },
  documento: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    requiresAuth: true,
    requiresAdmin: true,
    antivirusScan: true,
  },
  // Imágenes del carrusel (config.Carousel). Sin entityRelation: la carga y
  // el reemplazo se hacen desde /config/carousel, que valida permisos y
  // actualiza fotoUrl. SVG excluido a propósito (puede contener scripts).
  carousel: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    requiresAuth: true,
    requiresAdmin: true,
    antivirusScan: false,
  },
};

export function getCategoryConfig(
  categoria: string,
): CategoryConfig | undefined {
  if (!Object.hasOwn(CATEGORY_CONFIG, categoria)) {
    return undefined;
  }
  return CATEGORY_CONFIG[categoria];
}

/** Raiz de subidas, resuelta una sola vez al cargar el modulo. */
const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

export const CATEGORY_UPLOAD_DIRS = Object.freeze({
  perfil: path.join(UPLOADS_ROOT, 'perfil'),
  producto: path.join(UPLOADS_ROOT, 'producto'),
  porcion: path.join(UPLOADS_ROOT, 'porcion'),
  solicitud: path.join(UPLOADS_ROOT, 'solicitud'),
  documento: path.join(UPLOADS_ROOT, 'documento'),
  carousel: path.join(UPLOADS_ROOT, 'carousel'),
});

// Los directorios se declaran con literales, asi que hay que evitar que se
// desincronicen del catalogo. Esto revienta al arrancar, no en produccion.
for (const categoria of Object.keys(CATEGORY_CONFIG)) {
  if (!Object.hasOwn(CATEGORY_UPLOAD_DIRS, categoria)) {
    throw new Error(
      `Falta el directorio de subida para la categoria '${categoria}'`,
    );
  }
}

/** Devuelve el directorio ya resuelto de una categoria valida. */
export function getCategoryUploadDir(categoria: string): string | undefined {
  if (!Object.hasOwn(CATEGORY_UPLOAD_DIRS, categoria)) {
    return undefined;
  }
  return CATEGORY_UPLOAD_DIRS[categoria as keyof typeof CATEGORY_UPLOAD_DIRS];
}
