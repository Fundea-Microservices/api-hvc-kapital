import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DispositivosController } from './dispositivos.controller';
import { DispositivosService } from './dispositivos.service';

/**
 * Modulo de equipos moviles (esquema `app`).
 *
 * AuthModule aporta los repositorios (EntitiesProvider) y el JwtModule que
 * necesitan el AuthGuard global y la ruta de bloqueo administrativo.
 */
@Module({
  imports: [AuthModule],
  controllers: [DispositivosController],
  providers: [DispositivosService],
  exports: [DispositivosService],
})
export class DispositivosModule {}
