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
import { AuthorizationExecutorService } from 'src/auth/usuarios/authorization-executor.service';

/**
 * Guard global que valida los permisos declarados con @RequirePermissions().
 *
 * Se ejecuta DESPUÉS del AuthGuard global, por lo que `request.user` ya viene
 * cargado (con su rol). La precedencia de la validación es:
 *
 * === PERMISOS (validación de acceso) ===
 *   1. Rol con `esAdmin` -> bypass de permisos (acceso total).
 *   2. Excepción por usuario (Permiso_Usuario): `permitido` decide.
 *   3. Asignación por rol (Permiso_Rol): si el rol tiene el permiso, permite.
 *   4. En cualquier otro caso, niega (403).
 *
 * === AUTORIZACIÓN (requiere humano) ===
 *   Si el permiso tiene `requires_auth = true`, el body de la petición debe
 *   incluir un `auth_code` que pertenezca a OTRO usuario activo con
 *   `autoriza = true` para ese permiso. La validación se delega en
 *   AuthorizationExecutorService.validarAuthCode() para no duplicar lógica.
 *
 *   La bitácora es SOLO para registro/auditoría, NO se consulta aquí.
 *
 * @throws ForbiddenException 403 si no tiene el permiso
 * @throws HttpException 428 si requiere autorización pero falta el auth_code o no es válido
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
    private readonly authorizationExecutor: AuthorizationExecutorService,
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
        // 2a. Excepción a nivel de usuario (tiene prioridad sobre el rol).
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
      }

      // ─── FASE 2: Si el permiso requiere autorización, validar auth_code ───
      if (permiso.requires_auth) {
        await this.verificarAutorizacion(user, permiso, request);
      }
    }

    return true;
  }

  /**
   * Valida que la petición incluya un `auth_code` válido de OTRO usuario
   * que tenga `autoriza = true` para el permiso indicado.
   *
   * La validación se delega en AuthorizationExecutorService.validarAuthCode(),
   * que verifica:
   *   1. El usuario del auth_code existe y está activo
   *   2. Tiene autoriza=true (general)
   *   3. Tiene autoriza=true para el permiso específico (Permiso_Rol o Permiso_Usuario)
   *   4. No es el mismo usuario que está logueado
   *
   * @throws HttpException 428 si falta el auth_code o no es válido
   */
  private async verificarAutorizacion(
    user: Usuario,
    permiso: Pick<Permiso, 'id' | 'codigo' | 'modulo' | 'accion' | 'requires_auth'>,
    request: any,
  ): Promise<void> {
    const body = request.body || {};
    const auth_code: string | undefined = body.auth_code;
    const permisoId: string = body.permisoId || permiso.id;

    // 1. Verificar que el body incluya auth_code
    if (!auth_code || typeof auth_code !== 'string' || auth_code.trim() === '') {
      this.logger.warn(
        `Permiso ${permiso.codigo} requiere autorización pero no se envió auth_code.`,
      );
      throw new HttpException(
        {
          statusCode: 428,
          message: 'Se requiere autorización previa para esta operación',
          requiresAuth: true,
          permisoId: permiso.id,
          permisoCodigo: permiso.codigo,
          permisoModulo: permiso.modulo,
          permisoAccion: permiso.accion,
          hint:
            'Incluya el campo "auth_code" en el body con el código de autorización ' +
            'de un usuario que tenga autoriza=true para este permiso.',
        },
        428,
      );
    }

    // 2. Delegar la validación completa al servicio reutilizable
    try {
      await this.authorizationExecutor.validarAuthCode(auth_code, permisoId, user.id);
    } catch (error: any) {
      // El servicio lanza objetos con statusCode y code
      const statusCode = error.statusCode || 428;
      const message = error.message || 'Error validando autorización';
      const code = error.code || 'AUTH-VAL';

      this.logger.warn(
        `Autorización rechazada para ${user.userName} en ${permiso.codigo}: [${code}] ${message}`,
      );

      throw new HttpException(
        {
          statusCode,
          message,
          requiresAuth: true,
          permisoId: permiso.id,
          permisoCodigo: permiso.codigo,
          permisoModulo: permiso.modulo,
          permisoAccion: permiso.accion,
          code,
        },
        statusCode,
      );
    }
  }
}
