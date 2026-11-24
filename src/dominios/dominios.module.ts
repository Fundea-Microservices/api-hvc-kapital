import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DominiosController } from './dominios.controller';
import { DominiosService } from './dominios.service';
import { DominioValoresController } from './valores/dominio-valores.controller';
import { DominioValoresService } from './valores/dominio-valores.service';
import { DominioRelacionesController } from './relaciones/dominio-relaciones.controller';
import { DominioRelacionesService } from './relaciones/dominio-relaciones.service';

/**
 * Dominios Maestros / Universales (esquema `config`).
 *
 * - AuthModule aporta los repositorios (EntitiesProvider) y la misma
 *   instancia de AuthorizationExecutorService, de modo que las escrituras
 *   pasan por el punto de control de autorización como el resto del sistema.
 * - Los controladores de valores y relaciones se registran antes del de
 *   dominios para que `GET /dominios/valores` no sea capturado por
 *   `GET /dominios/:id`.
 */
@Module({
  imports: [AuthModule],
  controllers: [
    DominioValoresController,
    DominioRelacionesController,
    DominiosController,
  ],
  providers: [
    DominiosService,
    DominioValoresService,
    DominioRelacionesService,
  ],
})
export class DominiosModule {}
