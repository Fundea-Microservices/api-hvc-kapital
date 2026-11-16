import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Dispositivo } from 'database/entities/dispositivo.entity';

// Entrega el dispositivo que ya resolvio el DeviceTokenGuard.
export const GetDispositivo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Dispositivo | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ dispositivo?: Dispositivo }>();

    return request.dispositivo;
  },
);
