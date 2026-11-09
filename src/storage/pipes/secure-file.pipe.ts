import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs'; 
const sharp = require('sharp');

@Injectable()
export class SecureFilePipe implements PipeTransform {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
  ];

  async transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se adjuntó ningún archivo.');
    }

    if (file.size > 5 * 1024 * 1024) {
      this.safeDeleteTemporaryFile(file);
      throw new BadRequestException('El archivo excede el tamaño máximo permitido (5MB).');
    }

    let fileBuffer: Buffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if (file.path && fs.existsSync(file.path)) {
      fileBuffer = fs.readFileSync(file.path);
    } else {
      throw new BadRequestException('No se pudo procesar la integridad del archivo subido.');
    }

    const fileTypeModule = await Function('return import("file-type")')();

    const fileTypeDetector =
      typeof fileTypeModule.fileTypeFromBuffer === 'function' ? fileTypeModule.fileTypeFromBuffer
        : typeof fileTypeModule.fromBuffer === 'function' ? fileTypeModule.fromBuffer
        : typeof fileTypeModule.default?.fileTypeFromBuffer === 'function' ? fileTypeModule.default.fileTypeFromBuffer
        : typeof fileTypeModule.default?.fromBuffer === 'function' ? fileTypeModule.default.fromBuffer
        : typeof fileTypeModule === 'function' ? fileTypeModule
        : typeof fileTypeModule.default === 'function' ? fileTypeModule.default : null;

    if (!fileTypeDetector) {
      this.safeDeleteTemporaryFile(file);
      throw new BadRequestException('Error interno de configuración de validación: No se encontró el método de lectura.');
    }

    const tipoReal = await fileTypeDetector(fileBuffer);

    if (!tipoReal || !this.allowedMimeTypes.includes(tipoReal.mime)) {
      this.safeDeleteTemporaryFile(file);
      throw new BadRequestException(`Formato no permitido o alterado. Tipo detectado: ${tipoReal?.mime || 'Desconocido'}`);
    }

    // 🔴 Variable para asegurar que el buffer viaja completo a los siguientes servicios
    let finalOutputBuffer = fileBuffer;

    if (tipoReal.mime.startsWith('image/')) {
      try {
        finalOutputBuffer = await sharp(fileBuffer)
          .toFormat(tipoReal.ext === 'jpg' ? 'jpeg' : (tipoReal.ext as any))
          .toBuffer();

        if (file.path) {
          // Si usamos DiskStorage, sobrescribimos el archivo físico
          fs.writeFileSync(file.path, finalOutputBuffer); 
        }

        file.size = finalOutputBuffer.length;
        file.mimetype = tipoReal.mime;
      } catch (error) {
        this.safeDeleteTemporaryFile(file);
        throw new BadRequestException('La imagen está corrupta o contiene datos no válidos.');
      }
    }

    // 🔴 SOLUCIÓN CLAVE: Siempre inyectamos el buffer limpio de regreso al objeto 'file'.
    // Esto evita que 'magic-number.validator.ts' reciba 'undefined'.
    file.buffer = finalOutputBuffer;

    return file;
  }

  private safeDeleteTemporaryFile(file: Express.Multer.File) {
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        // Fallo silencioso si el archivo ya no existe
      }
    }
  }
}