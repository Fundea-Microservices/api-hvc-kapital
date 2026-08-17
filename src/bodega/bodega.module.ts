import { Module } from '@nestjs/common';
import { DatabaseModule } from 'database/database.module';
import { EntitiesProvider } from 'database/entities/entities.provider';
import { BodegaController } from './bodega.controller';
import { CategoriasInsumoService } from './services/categorias-insumo.service';
import { InsumosService } from './services/insumos.service';
import { MovimientosInsumoService } from './services/movimientos-insumo.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BodegaController],
  providers: [
    ...EntitiesProvider,
    CategoriasInsumoService,
    InsumosService,
    MovimientosInsumoService,
  ],
  exports: [CategoriasInsumoService, InsumosService, MovimientosInsumoService],
})
export class BodegaModule {}
