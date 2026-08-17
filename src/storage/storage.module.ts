import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ThrottlerModule } from '@nestjs/throttler';
import { ExportService } from './export.service';
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
        fileSize: 50 * 1024 * 1024,
      },
    }),
    ThrottlerModule,
  ],
  controllers: [StorageController],
  providers: [
    ExportService,
    StorageService,
    FileValidationService,
    AntivirusService,
    EntityUpdaterService,
    CategoryAccessGuard,
    FileLoggingInterceptor,
    ...EntitiesProvider,
  ],
  exports: [ExportService, StorageService, EntityUpdaterService],
})
export class StorageModule {}
