import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Usuario } from 'database/entities/usuario.entity';
import { getCategoryConfig } from '../config/category.config';

@Injectable()
export class CategoryAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: Usuario; params: Record<string, string> }>();
    const user = request.user;
    const categoria = request.params.categoria;

    const config = getCategoryConfig(categoria);
    if (!config) {
      throw new ForbiddenException('Categoría inválida');
    }

    // Se valida antes que requiresAdmin: sin usuario no hay rol que revisar.
    if (config.requiresAuth && !user) {
      throw new ForbiddenException('Autenticación requerida');
    }

    // Mismo criterio que AdminOnlyGuard: la bandera esAdmin del rol, no su
    // nombre (el rol sembrado se llama 'Administrador', no 'Admin').
    if (config.requiresAdmin && user?.rol?.esAdmin !== true) {
      throw new ForbiddenException(
        'Solo administradores pueden subir archivos a esta categoría',
      );
    }

    return true;
  }
}
