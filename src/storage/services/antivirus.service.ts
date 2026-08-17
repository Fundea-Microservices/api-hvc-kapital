import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AntivirusService {
  private readonly logger = new Logger(AntivirusService.name);

  async scanFile(filePath: string): Promise<boolean> {
    this.logger.warn('Antivirus scan skipped (not configured)');
    return true;
  }
}
