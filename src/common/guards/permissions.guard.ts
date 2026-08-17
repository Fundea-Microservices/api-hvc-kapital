import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { Usuario } from 'database/entities/usuario.entity';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { PermisoRol } from 'database/entities/permisos/permiso-rol.entity';
import { PermisoUsuario } from 'database/entities/permisos/permiso-usuario.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Guard global que valida los permisos declarados con @RequirePermissions().
 *
 * Se ejecuta DESPUÉS del AuthGuard global, por lo que `request.user` ya viene
 * cargado (con su rol). La precedencia de la validación es:
 *   1. Rol con `esAdmin` -> acceso total.
 *   2. Excepción por usuario (Permiso_Usuario): `permitido` decide (1 permite, 0 niega).
 *   3. Asignación por rol (Permiso_Rol): si el rol tiene el permiso, permite.
 *   4. En cualquier otro caso, niega.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,
    @Inject('PERMISO_ROL_REPOSITORY')
    private readonly permisoRolRepository: Repository<PermisoRol>,
    @Inject('PERMISO_USUARIO_REPOSITORY')
    private readonly permisoUsuarioRepository: Repository<PermisoUsuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no declara permisos, no aplica esta validación.
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: Usuario = request.user;

    // El AuthGuard global debería haber inyectado el usuario. Si no está,
    // es que la ruta no exige token (ej. @Public): no podemos validar permisos.
    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // 1. Los administradores tienen acceso total.
    if (user.rol?.esAdmin) {
      return true;
    }

    // 2. Validamos cada permiso requerido (debe tenerlos todos).
    for (const codigoRaw of requiredPermissions) {
      const codigo = codigoRaw.toUpperCase();

      const permiso = await this.permisoRepository.findOne({
        where: { codigo },
        select: { id: true },
      });

      if (!permiso) {
        throw new InternalServerErrorException(
          `El permiso con código ${codigo} no ha sido configurado en la base de datos`,
        );
      }

      // 2a. Excepción a nivel de usuario: tiene prioridad sobre el rol.
      const excepcionUsuario = await this.permisoUsuarioRepository.findOne({
        where: { usuarioId: user.id, permisoId: permiso.id },
        select: { permitido: true },
      });

      if (excepcionUsuario) {
        if (excepcionUsuario.permitido) {
          continue; // Permiso concedido explícitamente al usuario.
        }
        throw new ForbiddenException(
          'El usuario no tiene el permiso para ejecutar esta acción',
        );
      }

      // 2b. Permiso heredado del rol.
      const permisoRol = await this.permisoRolRepository.findOne({
        where: { rolId: user.rolId, permisoId: permiso.id },
        select: { permisoId: true },
      });

      if (!permisoRol) {
        throw new ForbiddenException(
          'El usuario no tiene el permiso para ejecutar esta acción',
        );
      }
    }

    return true;
  }
}
