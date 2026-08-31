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
    antivirusScan: false,
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
