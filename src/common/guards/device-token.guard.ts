import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Dispositivo } from 'database/entities/dispositivo.entity';

/** Request con el equipo ya resuelto, para que el controlador no lo repita. */
type PeticionConDispositivo = Request & { dispositivo?: Dispositivo };

/**
 * Autoriza por posesion del `x-device-token` del equipo enrolado, sin JWT.
 *
 * Las rutas que lo usan van marcadas con @Public() porque el AuthGuard global
 * exigiria un token de usuario que todavia no existe (enrolamiento, version).
 */
@Injectable()
export class DeviceTokenGuard implements CanActivate {
  constructor(
    @Inject('DISPOSITIVO_REPOSITORY')
    private readonly dispositivoRepository: Repository<Dispositivo>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PeticionConDispositivo>();
    const deviceToken = request.headers['x-device-token'];

    if (!deviceToken || typeof deviceToken !== 'string') {
      throw new UnauthorizedException('DeviceToken es requerido');
    }

    const dispositivo = await this.dispositivoRepository.findOne({
      where: { deviceToken },
    });

    if (!dispositivo) {
      throw new ForbiddenException('Dispositivo no registrado');
    }

    // El mensaje exacto "Device Blocked" dispara el borrado de la base local
    // en la app: no cambiarlo sin cambiarlo tambien en apiClient.ts.
    if (!dispositivo.estado) {
      throw new ForbiddenException('Device Blocked');
    }

    request.dispositivo = dispositivo;
    return true;
  }
}
