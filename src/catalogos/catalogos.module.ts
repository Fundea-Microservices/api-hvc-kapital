import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CatalogosTiposController } from './tipos/catalogos-tipos.controller';
import { CatalogosTiposService } from './tipos/catalogos-tipos.service';
import { CatalogosItemsController } from './items/catalogos-items.controller';
import { CatalogosItemsService } from './items/catalogos-items.service';
import { CatalogosRelacionesController } from './relaciones/catalogos-relaciones.controller';
import { CatalogosRelacionesService } from './relaciones/catalogos-relaciones.service';

/**
 * Catálogos Maestros / Universales (esquema `catalogos`).
 *
 * - AuthModule aporta los repositorios (EntitiesProvider) y la misma
 *   instancia de AuthorizationExecutorService, de modo que las escrituras
 *   pasan por el punto de control de autorización como el resto del sistema.
 */
@Module({
  imports: [AuthModule],
  controllers: [
    CatalogosTiposController,
    CatalogosItemsController,
    CatalogosRelacionesController,
  ],
  providers: [
    CatalogosTiposService,
    CatalogosItemsService,
    CatalogosRelacionesService,
  ],
})
export class CatalogosModule {}
