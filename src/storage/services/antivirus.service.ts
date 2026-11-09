import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as clamav from 'clamav.js';
import { envs } from 'src/config';

export interface ScanResult {
  clean: boolean;
  virus?: string;
}

@Injectable()
export class AntivirusService implements OnModuleInit {
  private readonly logger = new Logger(AntivirusService.name);

  private get enabled(): boolean {
    return envs.antivirusEnabled;
  }
  private get host(): string {
    return envs.clamavHost;
  }
  private get port(): number {
    return envs.clamavPort;
  }
  private get timeoutMs(): number {
    return envs.clamavTimeoutMs;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Antivirus deshabilitado (ANTIVIRUS_ENABLED=false)');
      return;
    }
    
    // Validamos la conectividad al arrancar el servidor sin tumbar la aplicación si falla
    clamav.ping(this.port, this.host, this.timeoutMs, (err) => {
      if (err) {
        this.logger.error(`clamd no disponible en ${this.host}:${this.port} -> ${err}`);
      } else {
        this.logger.log(`clamd disponible en ${this.host}:${this.port}`);
      }
    });
  }

  /**
   * Escanea un archivo en busca de malware usando INSTREAM de TCP.
   */
  async scanFile(source: string | Buffer): Promise<ScanResult> {
    if (!this.enabled) {
      this.logger.warn('scanFile omitido: antivirus deshabilitado');
      return { clean: true };
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(source)) {
      buffer = source;
    } else {
      try {
        buffer = await fs.promises.readFile(source);
      } catch {
        throw new BadRequestException('Archivo no encontrado para escaneo');
      }
    }

    try {
      const result = await this.streamToClamd(buffer);
      if (!result.clean) {
        // Logueamos internamente el nombre del malware sin devolverlo al cliente
        this.logger.error(`Malware detectado: ${result.virus ?? 'desconocido'} (${buffer.length} bytes)`);
      }
      return result;
    } catch (error) {
      return this.handleScanFailure(error);
    }
  }

  private streamToClamd(buffer: Buffer): Promise<ScanResult> {
    const scan = new Promise<ScanResult>((resolve, reject) => {
      const scanner = clamav.createScanner(this.port, this.host);
      const stream = Readable.from(buffer);

      scanner.scan(stream, (err: Error | null, _object: unknown, malicious?: string) => {
        if (err) return reject(err);
        if (malicious) return resolve({ clean: false, virus: malicious });
        resolve({ clean: true });
      });
    });

    return this.withTimeout(scan, this.timeoutMs);
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Timeout de escaneo antivirus')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  private async handleScanFailure(error: unknown): Promise<ScanResult> {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Error de escaneo antivirus: ${message}`);

    if (envs.antivirusFailClosed) {
      // Fail-closed: ante la duda, no se permite la subida del archivo.
      throw new BadRequestException('No se pudo verificar el archivo (antivirus no disponible). Intente más tarde.');
    }
    
    this.logger.warn('Fail-open activo: se permite la subida pese al error de escaneo');
    return { clean: true };
  }
}