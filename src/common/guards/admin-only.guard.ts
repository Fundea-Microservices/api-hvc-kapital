import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_ADMIN_KEY } from '../decorators/admin.decorator';
import { Usuario } from 'database/entities/usuario.entity';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Verificamos si la ruta requiere permisos de administrador
    const isAdminRequired = this.reflector.getAllAndOverride<boolean>(
      IS_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no está marcada con @AdminOnly(), permitimos el paso
    if (!isAdminRequired) {
      return true;
    }

    // 2. Obtenemos el usuario que el AuthGuard ya inyectó en el request
    const request = context.switchToHttp().getRequest();
    const user: Usuario = request.user;

    // 3. Validamos si el usuario tiene el campo esAdmin en true a través de su rol
    if (!user || !user.rol || !user.rol.esAdmin) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para realizar esta acción',
      );
    }

    return true;
  }
}
