import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from 'src/auth/auth.module';
import { StorageModule } from 'src/storage/storage.module';
import { CATEGORY_CONFIG } from 'src/storage/config/category.config';
import { CarouselController } from './carousel.controller';
import { CarouselService } from './carousel.service';

/**
 * Módulo de carrusel (esquema `config`).
 *
 * - AuthModule: repositorios (EntitiesProvider) y la misma instancia de
 *   AuthorizationExecutorService, para que estas rutas también puedan
 *   ejecutarse vía el flujo de autorización.
 * - StorageModule: StorageService para subir/borrar imágenes.
 * - MulterModule: el FileInterceptor de este módulo debe escribir a disco
 *   (uploads/temp), igual que el de StorageModule, porque StorageService
 *   trabaja con file.path. El límite corta en multer las subidas mayores al
 *   máximo de la categoría (413) antes de procesarlas.
 */
@Module({
  imports: [
    AuthModule,
    StorageModule,
    MulterModule.register({
      dest: './uploads/temp',
      limits: { fileSize: CATEGORY_CONFIG.carousel.maxSize, files: 1 },
    }),
  ],
  controllers: [CarouselController],
  providers: [CarouselService],
})
export class CarouselModule {}
