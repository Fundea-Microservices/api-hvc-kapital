import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common';

@ApiTags('Estado')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Estado de la API',
    description:
      'Devuelve nombre, versión, entorno y la hora actual en la zona de presentación. Ruta pública, útil como health check.',
  })
  @ApiResponse({
    status: 200,
    description: 'La API está en línea.',
    schema: {
      example: {
        name: 'API REST Base',
        version: '2026-01',
        lastUpdate: '2026-08-17',
        status: 'online',
        environment: 'development',
        today: '2026-08-17T09:59:52-06:00',
        timezone: 'America/Guatemala',
        docs: '/v1/docs',
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }
}
