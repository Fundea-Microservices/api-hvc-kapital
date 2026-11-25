import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigGeneralController } from './config-general.controller';
import { ConfigGeneralService } from './config-general.service';
import { BitacoraConfigGeneralService } from './bitacora-config-general.service';

@Module({
  imports: [AuthModule],
  controllers: [ConfigGeneralController],
  providers: [ConfigGeneralService, BitacoraConfigGeneralService],
})
export class ConfigGeneralModule {}
