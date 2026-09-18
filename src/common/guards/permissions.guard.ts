import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
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
 * === PERMISOS (validación de acceso) ===
 *   1. Rol con `esAdmin` -> bypass de permisos.
 *   2. Excepción por usuario (Permiso_Usuario): `permitido` decide.
 *   3. Asignación por rol (Permiso_Rol): si el rol tiene el permiso, permite.
 *   4. En cualquier otro caso, niega (403).
 *
 * === AUTORIZACIÓN (requiere humano) ===
 *   Si el permiso tiene `requires_auth = true`, el body debe incluir un
 *   `auth_code` de OTRO usuario activo con `autoriza = true` para ese permiso.
 *   La validación se hace contra Permiso_Rol y Permiso_Usuario, NO contra
 *   la bitácora (que es solo para registro/auditoría).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger('PermissionsGuard');

  constructor(
    private readonly reflector: Reflector,
    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,
    @Inject('PERMISO_ROL_REPOSITORY')
    private readonly permisoRolRepository: Repository<PermisoRol>,
    @Inject('PERMISO_USUARIO_REPOSITORY')
    private readonly permisoUsuarioRepository: Repository<PermisoUsuario>,
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: Usuario = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const isAdmin = user.rol?.esAdmin === true;

    // ─── FASE 1: Validar que el usuario tenga cada permiso requerido ───
    for (const codigoRaw of requiredPermissions) {
      const codigo = codigoRaw.toUpperCase();

      const permiso = await this.permisoRepository.findOne({
        where: { codigo },
        select: { id: true, codigo: true, modulo: true, accion: true, requires_auth: true },
      });

      if (!permiso) {
        throw new InternalServerErrorException(
          `El permiso con código ${codigo} no ha sido configurado en la base de datos`,
        );
      }

      // Los admins bypassean la verificación de permiso asignado.
      if (!isAdmin) {
        const excepcionUsuario = await this.permisoUsuarioRepository.findOne({
          where: { usuarioId: user.id, permisoId: permiso.id },
          select: { permitido: true },
        });

        if (excepcionUsuario) {
          if (!excepcionUsuario.permitido) {
            throw new ForbiddenException(
              'El usuario no tiene el permiso para ejecutar esta acción',
            );
          }
        } else {
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
      }

      // ─── FASE 2: Si requiere autorización, validar auth_code ───
      if (permiso.requires_auth) {
        throw new HttpException(
          {
            statusCode: 428,
            message: 'Se requiere autorización previa para esta operación',
            permisoId: permiso.id,
          },
          428,
        );
      }
    }

    return true;
  }

}
