import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { SesionesAppController } from './sesiones-app.controller';
import { SesionesAppService } from './sesiones-app.service';

/**
 * Sesiones de la app movil (app.Sesiones): registro, refresh y logout.
 * AuthModule aporta los repositorios y el JwtModule que firma el access token.
 */
@Module({
  imports: [AuthModule],
  controllers: [SesionesAppController],
  providers: [SesionesAppService],
  exports: [SesionesAppService],
})
export class SesionesAppModule {}
