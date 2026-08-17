import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CATEGORY_CONFIG } from '../config/category.config';

@Injectable()
export class CategoryAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const categoria = request.params.categoria;

    const config = CATEGORY_CONFIG[categoria];
    if (!config) {
      throw new ForbiddenException(`Categoría inválida: ${categoria}`);
    }

    if (config.requiresAdmin && user.rol?.nombre !== 'Admin') {
      throw new ForbiddenException(
        'Solo administradores pueden subir archivos a esta categoría',
      );
    }

    if (config.requiresAuth && !user) {
      throw new ForbiddenException('Autenticación requerida');
    }

    return true;
  }
}
