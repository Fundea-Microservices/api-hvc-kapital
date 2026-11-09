import { BadRequestException } from '@nestjs/common';

/** Secuencia de bytes que debe aparecer en una posición del archivo. */
interface ParteFirma {
  offset: number;
  bytes: Buffer;
}

/** Una firma válida = todas sus partes coinciden. */
type Firma = ParteFirma[];

const ascii = (texto: string) => Buffer.from(texto, 'ascii');

export class MagicNumberValidator {
  private static readonly firmas: Record<string, Firma[]> = {
    'image/png': [
      [
        {
          offset: 0,
          bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        },
      ],
    ],
    // FF D8 FF es común a todas las variantes JPEG (JFIF E0, EXIF E1,
    // ICC E2, SPIFF E8, sin cabecera DB, Adobe EE...).
    'image/jpeg': [[{ offset: 0, bytes: Buffer.from([0xff, 0xd8, 0xff]) }]],
    'application/pdf': [
      [{ offset: 0, bytes: Buffer.from([0x25, 0x50, 0x44, 0x46]) }],
    ],
    // "RIFF" solo identifica el contenedor (también lo usan WAV y AVI): se
    // exige además la marca "WEBP" en el byte 8.
    'image/webp': [
      [
        { offset: 0, bytes: ascii('RIFF') },
        { offset: 8, bytes: ascii('WEBP') },
      ],
    ],
    'image/gif': [
      [{ offset: 0, bytes: ascii('GIF87a') }],
      [{ offset: 0, bytes: ascii('GIF89a') }],
    ],
  };

  /** Bytes de cabecera necesarios para evaluar cualquier firma. */
  private static readonly HEADER_LENGTH = 16;

  static async validate(file: Express.Multer.File): Promise<void> {
    const firmasEsperadas = this.firmas[file.mimetype];
    if (!firmasEsperadas) {
      throw new BadRequestException(
        'Tipo de archivo no soportado para validación',
      );
    }

    const header = await this.leerCabecera(file);

    const isValid = firmasEsperadas.some((firma) =>
      firma.every(({ offset, bytes }) =>
        header.subarray(offset, offset + bytes.length).equals(bytes),
      ),
    );

    if (!isValid) {
      throw new BadRequestException(
        'El contenido del archivo no coincide con su extensión (magic number inválido)',
      );
    }
  }

  /** Lee solo la cabecera, sin cargar el archivo completo en memoria. */
  private static async leerCabecera(
    file: Express.Multer.File,
  ): Promise<Buffer> {
    if (file.buffer) {
      return file.buffer.subarray(0, this.HEADER_LENGTH);
    }
    if (file.path) {
      const fs = await import('fs/promises');
      const handle = await fs.open(file.path, 'r');
      try {
        const buffer = Buffer.alloc(this.HEADER_LENGTH);
        const { bytesRead } = await handle.read(
          buffer,
          0,
          this.HEADER_LENGTH,
          0,
        );
        return buffer.subarray(0, bytesRead);
      } finally {
        await handle.close();
      }
    }
    throw new BadRequestException('Archivo no accesible para validación');
  }
}
