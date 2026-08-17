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
