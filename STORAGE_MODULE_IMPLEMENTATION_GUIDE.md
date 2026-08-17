# Guía de Implementación: Módulo de Storage Seguro con Antivirus

## Contexto y Problema

Necesito implementar un módulo de gestión de archivos (upload/download) en una API NestJS con las siguientes características:

### Problemas comunes a resolver:
1. **Validación débil de archivos** - usuarios pueden subir ejecutables renombrados como imágenes
2. **Path traversal** - ataques mediante rutas como `../../../etc/passwd`
3. **Sin rate limiting** - vulnerable a ataques DoS
4. **Arquitectura desorganizada** - múltiples controllers con lógica duplicada
5. **Sin escaneo de virus** - archivos maliciosos pueden ser subidos
6. **Ubicación inconsistente** - archivos mezclados con código fuente

---

## Arquitectura Objetivo

### Estructura de directorios

```
/proyecto/
├── uploads/                          # Archivos separados del código
│   ├── perfil/
│   ├── producto/
│   ├── solicitud/
│   ├── documento/
│   └── temp/                         # Para uploads en proceso
├── src/
│   └── storage/
│       ├── config/
│       │   └── category.config.ts    # Configuración centralizada
│       ├── controllers/
│       │   └── storage.controller.ts # Controller unificado
│       ├── services/
│       │   ├── storage.service.ts
│       │   ├── file-validation.service.ts
│       │   ├── antivirus.service.ts  # ⚠️ Implementación completa
│       │   └── entity-updater.service.ts
│       ├── guards/
│       │   └── category-access.guard.ts
│       ├── interceptors/
│       │   └── file-logging.interceptor.ts
│       ├── validators/
│       │   ├── magic-number.validator.ts
│       │   └── path-security.validator.ts
│       ├── utils/
│       │   └── filename-sanitizer.ts
│       ├── dto/
│       │   └── upload-file.dto.ts
│       └── storage.module.ts
```

### URLs RESTful

```
POST   /storage/upload/{categoria}
GET    /storage/{categoria}/{archivo}
```

---

## Implementación Paso a Paso

### 1. Instalación de Dependencias

```bash
npm install @nestjs/throttler
npm install clamav.js  # Para escaneo de virus con ClamAV
# O alternativamente
npm install virustotal-api  # Para escaneo cloud con VirusTotal
```

### 2. Configuración por Categoría

**Archivo:** `src/storage/config/category.config.ts`

```typescript
export interface CategoryConfig {
  maxSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  requiresAuth: boolean;
  requiresAdmin: boolean;
  antivirusScan: boolean;  // ⚠️ true para categorías que requieren escaneo
  entityRelation?: {
    entity: string;
    field: string;
  };
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  perfil: {
    maxSize: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/png', 'image/jpeg'],
    allowedExtensions: ['.png', '.jpg', '.jpeg'],
    requiresAuth: true,
    requiresAdmin: false,
    antivirusScan: true,  // ✅ Escanear fotos de perfil
    entityRelation: { entity: 'Usuario', field: 'fotoUrl' },
  },
  producto: {
    maxSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
    requiresAuth: true,
    requiresAdmin: true,
    antivirusScan: true,  // ✅ Escanear fotos de productos
    entityRelation: { entity: 'Producto', field: 'fotoUrl' },
  },
  documento: {
    maxSize: 50 * 1024 * 1024,
    allowedMimeTypes: ['application/pdf', 'application/msword'],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    requiresAuth: true,
    requiresAdmin: true,
    antivirusScan: true,  // ✅ Escanear documentos
  },
};
```

---

### 3. Validador de Magic Numbers (Anti-Spoofing)

**Archivo:** `src/storage/validators/magic-number.validator.ts`

```typescript
import { BadRequestException } from '@nestjs/common';

export class MagicNumberValidator {
  private static readonly magicNumbers: Record<string, Buffer[]> = {
    'image/png': [
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
    'image/jpeg': [
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.from([0xff, 0xd8, 0xff, 0xe1]),
      Buffer.from([0xff, 0xd8, 0xff, 0xe2]),
      Buffer.from([0xff, 0xd8, 0xff, 0xe8]),
    ],
    'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
    'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
    'application/msword': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0])],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP signature
    ],
  };

  static async validate(file: Express.Multer.File): Promise<void> {
    const expectedMagics = this.magicNumbers[file.mimetype];
    if (!expectedMagics) {
      throw new BadRequestException(
        'Tipo de archivo no soportado para validación',
      );
    }

    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path) {
      const fs = await import('fs/promises');
      buffer = await fs.readFile(file.path);
    } else {
      throw new BadRequestException('Archivo no accesible para validación');
    }

    const header = buffer.slice(0, 8);
    const isValid = expectedMagics.some((magic) =>
      header.slice(0, magic.length).equals(magic),
    );

    if (!isValid) {
      throw new BadRequestException(
        'El contenido del archivo no coincide con su extensión (magic number inválido)',
      );
    }
  }
}
```

---

### 4. Validador de Path Traversal (Anti-Directory Escape)

**Archivo:** `src/storage/validators/path-security.validator.ts`

```typescript
import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export class PathSecurityValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /\.\./g,           // .. (estándar)
    /\.%2e/gi,         // .%2e (encoded)
    /%2e\./gi,         // %2e. (encoded)
    /%2e%2e/gi,        // %2e%2e (fully encoded)
    /\0/g,             // null bytes
    /[<>:"|?*]/g,      // caracteres ilegales Windows
    /^\/+/,            // absolute paths
    /\/{2,}/g,         // múltiples slashes
  ];

  static validatePath(filePath: string, category: string): string {
    let decoded = decodeURIComponent(filePath);
    decoded = path.normalize(decoded);

    // Verificar patrones peligrosos
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(decoded)) {
        throw new BadRequestException(`Ruta inválida detectada: ${filePath}`);
      }
    }

    // Solo caracteres seguros
    if (!/^[a-zA-Z0-9._-]+$/.test(decoded)) {
      throw new BadRequestException(
        'El nombre de archivo contiene caracteres no permitidos',
      );
    }

    // Verificar longitud
    if (decoded.length > 255) {
      throw new BadRequestException('Nombre de archivo demasiado largo');
    }

    // Verificar que no sale del directorio base
    const uploadDir = path.resolve(process.cwd(), 'uploads', category);
    const targetPath = path.resolve(uploadDir, decoded);

    if (!targetPath.startsWith(uploadDir + path.sep)) {
      throw new BadRequestException('Intento de path traversal detectado');
    }

    return decoded;
  }
}
```

---

### 5. Sanitizador de Nombres de Archivo

**Archivo:** `src/storage/utils/filename-sanitizer.ts`

```typescript
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
      .replace(/[^\w\s-]/g, '')       // Solo alfanuméricos, espacios, guiones
      .replace(/\s+/g, '_')            // Espacios → underscores
      .replace(/_+/g, '_')             // Múltiples underscores → uno
      .replace(/^[._-]+/, '')          // Eliminar dots/guiones al inicio
      .replace(/[._-]+$/, '')          // Eliminar dots/guiones al final
      .toLowerCase();

    if (name.length > 100) {
      name = name.substring(0, 100);
    }

    const timestamp = Date.now();
    return `${name}-${timestamp}${ext}`;
  }
}
```

---

### 6. Servicio de Antivirus (⚠️ IMPLEMENTACIÓN COMPLETA)

**Archivo:** `src/storage/services/antivirus.service.ts`

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';

// Opción 1: ClamAV (Local - Más rápido)
import * as clamav from 'clamav.js';

// Opción 2: VirusTotal (Cloud - Más preciso pero más lento)
// import * as virustotal from 'virustotal-api';

@Injectable()
export class AntivirusService {
  private readonly logger = new Logger(AntivirusService.name);
  private readonly useClamAV = process.env.ANTIVIRUS_ENGINE === 'clamav';
  private readonly useVirusTotal = process.env.ANTIVIRUS_ENGINE === 'virustotal';

  // ============================================================
  // OPCIÓN 1: ClamAV (Local)
  // ============================================================
  // Requisitos:
  // 1. Instalar ClamAV en el servidor:
  //    - Ubuntu/Debian: sudo apt-get install clamav clamav-daemon
  //    - MacOS: brew install clamav
  //    - Windows: https://www.clamav.net/downloads
  // 2. Actualizar bases de datos: sudo freshclam
  // 3. Iniciar daemon: sudo systemctl start clamav-daemon
  // 4. npm install clamav.js

  private async scanWithClamAV(filePath: string): Promise<boolean> {
    try {
      this.logger.log(`Escaneando archivo con ClamAV: ${filePath}`);

      const scanner = await clamav.createScanner(3310, 'localhost');
      const result = await scanner.scanFile(filePath);

      if (result.isInfected) {
        this.logger.error(
          `⚠️ Archivo infectado detectado: ${result.viruses.join(', ')}`,
        );
        throw new BadRequestException(
          `Archivo contiene malware: ${result.viruses.join(', ')}`,
        );
      }

      this.logger.log(`✅ Archivo limpio: ${filePath}`);
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error escaneando con ClamAV: ${error.message}`);
      
      // En producción, FALLAR si el antivirus no está disponible
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(
          'Servicio de antivirus no disponible. Por seguridad, no se puede procesar el archivo.',
        );
      }
      
      // En desarrollo, permitir continuar con warning
      this.logger.warn('⚠️ ClamAV no disponible - permitiendo upload en modo desarrollo');
      return true;
    }
  }

  // ============================================================
  // OPCIÓN 2: VirusTotal (Cloud)
  // ============================================================
  // Requisitos:
  // 1. Registrarse en https://www.virustotal.com
  // 2. Obtener API Key desde https://www.virustotal.com/gui/my-apikey
  // 3. Configurar en .env: VIRUSTOTAL_API_KEY=tu_api_key
  // 4. npm install virustotal-api
  // 
  // Límites:
  // - Plan gratuito: 4 requests/min, 500 requests/día
  // - Archivos hasta 32MB (650MB en plan premium)

  private async scanWithVirusTotal(filePath: string): Promise<boolean> {
    try {
      const apiKey = process.env.VIRUSTOTAL_API_KEY;
      if (!apiKey) {
        throw new Error('VIRUSTOTAL_API_KEY no configurada');
      }

      this.logger.log(`Escaneando archivo con VirusTotal: ${filePath}`);

      // Leer archivo
      const fileBuffer = await fs.readFile(filePath);
      
      // Calcular hash SHA256
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // 1. Buscar por hash primero (más rápido)
      const response = await fetch(
        `https://www.virustotal.com/api/v3/files/${hash}`,
        {
          headers: { 'x-apikey': apiKey },
        },
      );

      if (response.ok) {
        const data = await response.json();
        return this.analyzeVirusTotalResult(data, filePath);
      }

      // 2. Si no existe, subir archivo para escaneo
      this.logger.log('Archivo no encontrado en cache, subiendo para escaneo...');
      
      const formData = new FormData();
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob);

      const uploadResponse = await fetch(
        'https://www.virustotal.com/api/v3/files',
        {
          method: 'POST',
          headers: { 'x-apikey': apiKey },
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error(`VirusTotal upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      const analysisId = uploadData.data.id;

      // 3. Esperar resultado (polling cada 10 segundos, máximo 2 minutos)
      return await this.waitForVirusTotalAnalysis(analysisId, apiKey);

    } catch (error) {
      this.logger.error(`Error escaneando con VirusTotal: ${error.message}`);
      
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(
          'Servicio de antivirus no disponible. Por seguridad, no se puede procesar el archivo.',
        );
      }
      
      this.logger.warn('⚠️ VirusTotal no disponible - permitiendo upload en modo desarrollo');
      return true;
    }
  }

  private analyzeVirusTotalResult(data: any, filePath: string): boolean {
    const stats = data.data.attributes.last_analysis_stats;
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;

    this.logger.log(
      `Resultado VirusTotal: ${malicious} malicious, ${suspicious} suspicious`,
    );

    if (malicious > 0) {
      const engines = data.data.attributes.last_analysis_results;
      const detectedBy = Object.entries(engines)
        .filter(([_, result]: any) => result.category === 'malicious')
        .map(([engine, _]) => engine)
        .slice(0, 3);

      throw new BadRequestException(
        `Archivo contiene malware detectado por: ${detectedBy.join(', ')}`,
      );
    }

    if (suspicious > 2) {
      throw new BadRequestException(
        `Archivo sospechoso detectado por ${suspicious} motores de análisis`,
      );
    }

    this.logger.log(`✅ Archivo limpio: ${filePath}`);
    return true;
  }

  private async waitForVirusTotalAnalysis(
    analysisId: string,
    apiKey: string,
    maxAttempts = 12,
  ): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 segundos

      const response = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
          headers: { 'x-apikey': apiKey },
        },
      );

      if (!response.ok) {
        throw new Error('Error obteniendo análisis de VirusTotal');
      }

      const data = await response.json();
      const status = data.data.attributes.status;

      if (status === 'completed') {
        return this.analyzeVirusTotalResult(data, 'uploaded-file');
      }

      this.logger.log(`Esperando análisis... intento ${i + 1}/${maxAttempts}`);
    }

    throw new BadRequestException(
      'Timeout esperando análisis de VirusTotal',
    );
  }

  // ============================================================
  // MÉTODO PÚBLICO (Selector de motor)
  // ============================================================
  async scanFile(filePath: string): Promise<boolean> {
    // Verificar que el archivo existe
    try {
      await fs.access(filePath);
    } catch {
      throw new BadRequestException('Archivo no encontrado para escaneo');
    }

    // Seleccionar motor según configuración
    if (this.useClamAV) {
      return this.scanWithClamAV(filePath);
    }

    if (this.useVirusTotal) {
      return this.scanWithVirusTotal(filePath);
    }

    // Sin motor configurado
    this.logger.warn(
      '⚠️ No hay motor de antivirus configurado. Configure ANTIVIRUS_ENGINE=clamav o virustotal',
    );

    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'Antivirus no configurado. Por seguridad, no se puede procesar el archivo.',
      );
    }

    return true;
  }
}
```

**Configuración en `.env`:**

```bash
# Opción 1: ClamAV (local)
ANTIVIRUS_ENGINE=clamav

# Opción 2: VirusTotal (cloud)
ANTIVIRUS_ENGINE=virustotal
VIRUSTOTAL_API_KEY=tu_api_key_aqui

# Para desarrollo sin antivirus
NODE_ENV=development
```

---

### 7. Servicio de Validación de Archivos

**Archivo:** `src/storage/services/file-validation.service.ts`

```typescript
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
```

---

### 8. Servicio de Actualización de Entidades

**Archivo:** `src/storage/services/entity-updater.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CATEGORY_CONFIG } from '../config/category.config';

@Injectable()
export class EntityUpdaterService {
  constructor(
    @Inject('USUARIO_REPOSITORY')
    private usuarioRepository: Repository<any>,
    @Inject('PRODUCTO_REPOSITORY')
    private productoRepository: Repository<any>,
    // Agregar más repositorios según sea necesario
  ) {}

  async updateEntityUrl(options: {
    categoria: string;
    entityId: string;
    fileUrl: string;
    fieldName?: string;
  }): Promise<void> {
    const { categoria, entityId, fileUrl, fieldName } = options;
    const config = CATEGORY_CONFIG[categoria];

    if (!config.entityRelation) return;

    switch (config.entityRelation.entity) {
      case 'Usuario':
        const user = await this.usuarioRepository.findOne({
          where: { usuarioId: entityId },
        });
        if (user) {
          user.fotoUrl = fileUrl;
          await this.usuarioRepository.save(user);
        }
        break;

      case 'Producto':
        const product = await this.productoRepository.findOne({
          where: { id: entityId },
        });
        if (product) {
          const field = fieldName || 'fotoUrl';
          product[field] = fileUrl;
          await this.productoRepository.save(product);
        }
        break;
    }
  }
}
```

---

### 9. Servicio Principal de Storage

**Archivo:** `src/storage/services/storage.service.ts`

```typescript
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
      // 1. Validar categoría
      const config = CATEGORY_CONFIG[categoria];
      if (!config) {
        return this.customThrowError(
          '',
          'STG-01-01',
          `Categoría inválida: ${categoria}`,
        );
      }

      // 2. Validar tamaño
      if (file.size > config.maxSize) {
        return this.customThrowError(
          '',
          'STG-01-02',
          `Archivo excede tamaño máximo de ${config.maxSize / 1024 / 1024}MB`,
        );
      }

      // 3. Validar tipo MIME y extensión
      this.validationService.validateMimeType(file, config.allowedMimeTypes);
      this.validationService.validateExtension(file, config.allowedExtensions);

      // 4. Validar magic numbers (previene ejecutables disfrazados)
      await this.validationService.validateMagicNumbers(file);

      // 5. ⚠️ ESCANEAR VIRUS (si está habilitado para esta categoría)
      if (config.antivirusScan) {
        this.logger.log(`Iniciando escaneo de virus para categoría: ${categoria}`);
        await this.antivirusService.scanFile(file.path);
        this.logger.log(`✅ Archivo limpio`);
      }

      // 6. Sanitizar nombre
      const sanitizedName = customName
        ? FilenameSanitizer.sanitize(customName, false) +
          path.extname(file.originalname)
        : FilenameSanitizer.sanitize(file.originalname);

      // 7. Guardar archivo
      const categoryPath = path.join(process.cwd(), 'uploads', categoria);
      await fs.mkdir(categoryPath, { recursive: true });

      const targetPath = path.join(categoryPath, sanitizedName);
      await fs.copyFile(file.path, targetPath);
      await fs.unlink(file.path); // Limpiar temp

      // 8. Generar URL pública
      const publicUrl = `/storage/${categoria}/${sanitizedName}`;

      // 9. Actualizar entidad relacionada si aplica
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
```

---

### 10. Guard de Acceso por Categoría

**Archivo:** `src/storage/guards/category-access.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CATEGORY_CONFIG } from '../config/category.config';

@Injectable()
export class CategoryAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const categoria = request.params.categoria;

    const config = CATEGORY_CONFIG[categoria];
    if (!config) {
      throw new ForbiddenException(`Categoría inválida: ${categoria}`);
    }

    if (config.requiresAdmin && user.rol?.nombre !== 'Admin') {
      throw new ForbiddenException(
        'Solo administradores pueden subir archivos a esta categoría',
      );
    }

    if (config.requiresAuth && !user) {
      throw new ForbiddenException('Autenticación requerida');
    }

    return true;
  }
}
```

---

### 11. Interceptor de Logging

**Archivo:** `src/storage/interceptors/file-logging.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class FileLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('FileOperations');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const file = request.file;
    const categoria = request.params.categoria;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log({
            operation: method === 'POST' ? 'UPLOAD' : 'DOWNLOAD',
            categoria,
            fileName: file?.originalname || request.params.fileName,
            fileSize: file?.size,
            userId: user?.usuarioId,
            duration: `${duration}ms`,
            success: true,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            operation: method === 'POST' ? 'UPLOAD' : 'DOWNLOAD',
            categoria,
            fileName: file?.originalname || request.params.fileName,
            userId: user?.usuarioId,
            duration: `${duration}ms`,
            success: false,
            error: error.message,
          });
        },
      }),
    );
  }
}
```

---

### 12. DTO de Upload

**Archivo:** `src/storage/dto/upload-file.dto.ts`

```typescript
import { IsOptional, IsString, Matches, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    required: false,
    description: 'Nombre personalizado sin extensión',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'El nombre solo puede contener letras, números, guiones y guiones bajos',
  })
  customName?: string;

  @ApiProperty({ required: false, description: 'Metadatos adicionales' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

**⚠️ IMPORTANTE:** NO incluir campo `file` en el DTO - se captura con `@UploadedFile()`

---

### 13. Controller Unificado

**Archivo:** `src/storage/controllers/storage.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { StorageService } from '../services/storage.service';
import { UploadFileDto } from '../dto/upload-file.dto';
import { CategoryAccessGuard } from '../guards/category-access.guard';
import { FileLoggingInterceptor } from '../interceptors/file-logging.interceptor';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Storage')
@Controller('storage')
@UseGuards(AuthGuard)
@UseInterceptors(FileLoggingInterceptor)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/:categoria')
  @UseGuards(CategoryAccessGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 uploads por minuto
  @ApiOperation({ summary: 'Subir archivo a una categoría específica' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'categoria',
    enum: ['perfil', 'producto', 'solicitud', 'documento'],
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        customName: { type: 'string' },
        metadata: { type: 'object' },
      },
    },
  })
  async uploadFile(
    @Param('categoria') categoria: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @GetUser() user: any,
  ) {
    return this.storageService.uploadFile({
      file,
      categoria,
      customName: dto.customName,
      metadata: dto.metadata,
      userId: user.usuarioId,
    });
  }

  @Get(':categoria/:fileName')
  @Throttle({ medium: { limit: 100, ttl: 60000 } }) // 100 downloads por minuto
  @ApiOperation({ summary: 'Descargar archivo por categoría y nombre' })
  @ApiParam({
    name: 'categoria',
    enum: ['perfil', 'producto', 'solicitud', 'documento'],
  })
  @ApiParam({ name: 'fileName', description: 'Nombre del archivo' })
  async downloadFile(
    @Param('categoria') categoria: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    return this.storageService.downloadFile(categoria, fileName, res);
  }
}
```

---

### 14. Storage Module

**Archivo:** `src/storage/storage.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ThrottlerModule } from '@nestjs/throttler';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { FileValidationService } from './services/file-validation.service';
import { AntivirusService } from './services/antivirus.service';
import { EntityUpdaterService } from './services/entity-updater.service';
import { CategoryAccessGuard } from './guards/category-access.guard';
import { FileLoggingInterceptor } from './interceptors/file-logging.interceptor';
import { DatabaseModule } from 'database/database.module';
import { EntitiesProvider } from 'database/entities/entities.provider';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({
      dest: './uploads/temp',
      limits: {
        fileSize: 50 * 1024 * 1024, // Límite global 50MB
      },
    }),
    ThrottlerModule,
  ],
  controllers: [StorageController],
  providers: [
    StorageService,
    FileValidationService,
    AntivirusService,
    EntityUpdaterService,
    CategoryAccessGuard,
    FileLoggingInterceptor,
    ...EntitiesProvider,
  ],
  exports: [StorageService, EntityUpdaterService],
})
export class StorageModule {}
```

---

### 15. App Module con Rate Limiting

**Archivo:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { StorageModule } from './storage/storage.module';
// ... otros imports

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },      // 3 req/segundo
      { name: 'medium', ttl: 60000, limit: 20 },   // 20 req/minuto
      { name: 'long', ttl: 3600000, limit: 100 },  // 100 req/hora
    ]),
    StorageModule,
    // ... otros módulos
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

---

## Preparación del Sistema (Linux/Ubuntu)

### Instalar ClamAV

```bash
# Instalar ClamAV
sudo apt-get update
sudo apt-get install clamav clamav-daemon

# Actualizar bases de datos de virus
sudo freshclam

# Iniciar daemon
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon

# Verificar que está corriendo
sudo systemctl status clamav-daemon

# Verificar puerto (debe estar escuchando en 3310)
sudo netstat -tulpn | grep clam
```

### Configuración de VirusTotal

```bash
# Registrarse en https://www.virustotal.com
# Obtener API key desde https://www.virustotal.com/gui/my-apikey
# Agregar a .env:
echo "VIRUSTOTAL_API_KEY=tu_api_key_aqui" >> .env
echo "ANTIVIRUS_ENGINE=virustotal" >> .env
```

---

## Testing

### Test de Upload con Virus (Archivo de Prueba EICAR)

```bash
# EICAR es un archivo de prueba estándar para antivirus
# NO es malware real, solo para testing

# Crear archivo de prueba EICAR
echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar.txt

# Intentar subir (DEBE ser rechazado)
curl -X POST http://localhost:3000/storage/upload/perfil \
  -H "Authorization: Bearer token" \
  -F "file=@eicar.txt"

# Resultado esperado:
# {
#   "success": false,
#   "message": "Archivo contiene malware: Win.Test.EICAR_HDB-1"
# }
```

### Test de Magic Numbers

```bash
# Crear archivo .exe renombrado como .jpg
cp /bin/ls fake-image.jpg

# Intentar subir (DEBE ser rechazado)
curl -X POST http://localhost:3000/storage/upload/perfil \
  -H "Authorization: Bearer token" \
  -F "file=@fake-image.jpg"

# Resultado esperado:
# {
#   "success": false,
#   "message": "magic number inválido"
# }
```

### Test de Path Traversal

```bash
# Intentar acceder a archivo fuera del directorio
curl http://localhost:3000/storage/perfil/../../../etc/passwd

# Resultado esperado:
# {
#   "success": false,
#   "message": "Path traversal detectado"
# }
```

### Test de Rate Limiting

```bash
# Hacer más de 3 uploads en 1 minuto
for i in {1..5}; do
  curl -X POST http://localhost:3000/storage/upload/perfil \
    -H "Authorization: Bearer token" \
    -F "file=@test.jpg"
done

# Resultado esperado después del 3er request:
# HTTP 429 Too Many Requests
```

---

## Códigos de Error

```typescript
// Storage Module Error Codes
STG-01-01: Categoría inválida
STG-01-02: Archivo excede tamaño máximo
STG-01-03: Archivo contiene malware
STG-01-04: Tipo de archivo no permitido
STG-01-05: Extensión no permitida
STG-01-06: Magic number inválido

STG-02-01: Categoría inválida en download
STG-02-02: Archivo no encontrado
STG-02-03: Error genérico de download
STG-02-04: Path traversal detectado
```

---

## Variables de Entorno Requeridas

```bash
# .env
NODE_ENV=production

# Antivirus - Elegir UNA opción
ANTIVIRUS_ENGINE=clamav         # Para ClamAV local
# O
ANTIVIRUS_ENGINE=virustotal     # Para VirusTotal cloud
VIRUSTOTAL_API_KEY=your_api_key # Solo si usas VirusTotal
```

---

## Checklist de Implementación

- [ ] Instalar dependencias (`@nestjs/throttler`, `clamav.js` o `virustotal-api`)
- [ ] Crear estructura de carpetas `uploads/` con subcarpetas
- [ ] Implementar todos los archivos listados arriba
- [ ] Configurar motor de antivirus (ClamAV o VirusTotal)
- [ ] Configurar variables de entorno
- [ ] Actualizar `app.module.ts` con `ThrottlerModule`
- [ ] Crear directorios de uploads en servidor de producción
- [ ] Configurar permisos en carpeta uploads (`chmod 755`)
- [ ] Probar upload con archivo real
- [ ] Probar upload con archivo EICAR (debe rechazarse)
- [ ] Probar upload con ejecutable renombrado (debe rechazarse)
- [ ] Probar path traversal attack (debe rechazarse)
- [ ] Probar rate limiting (debe limitarse después de 3 uploads)
- [ ] Verificar logs de operaciones
- [ ] Actualizar frontend con nuevos endpoints

---

## Características de Seguridad Implementadas

✅ **Magic Number Validation** - Previene ejecutables disfrazados  
✅ **Path Traversal Prevention** - Protege contra ataques de escape de directorio  
✅ **Rate Limiting** - Previene ataques DoS  
✅ **Antivirus Scanning** - Detecta malware real con ClamAV o VirusTotal  
✅ **Category-based Permissions** - Control granular de acceso  
✅ **File Size Limits** - Configurables por categoría  
✅ **MIME Type Validation** - Whitelist de tipos permitidos  
✅ **Filename Sanitization** - Elimina caracteres peligrosos  
✅ **Logging Estructurado** - Auditoría completa de operaciones  

---

## Arquitectura en Producción Recomendada

```
Frontend → CDN (CloudFront/Cloudflare)
            ↓
         Load Balancer
            ↓
    ┌──────┴──────┐
    ↓             ↓
API Server 1  API Server 2
    ↓             ↓
   ClamAV       ClamAV
    ↓             ↓
    └──────┬──────┘
           ↓
      S3 / Azure Blob
      (archivos)
```

**Para escalar a cloud storage:**
1. Implementar `S3StorageStrategy` con AWS SDK
2. Cambiar en `storage.service.ts` para usar strategy pattern
3. Subir a S3 después de validación y escaneo
4. Servir desde CloudFront CDN

---

Este documento proporciona una implementación completa y lista para producción de un módulo de storage seguro con escaneo de antivirus integrado.
