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
        await this.verificarAutorizacion(user, permiso, request);
      }
    }

    return true;
  }

  /**
   * Valida que el body incluya un `auth_code` válido de OTRO usuario
   * que tenga `autoriza = true` para el permiso indicado.
   *
   * Validaciones:
   *   1. El auth_code pertenece a un usuario existente y activo
   *   2. Ese usuario tiene autoriza=true (general)
   *   3. Ese usuario tiene autoriza=true para el permiso específico
   *   4. Ese usuario NO es el mismo que está logueado
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

    // 2. Buscar el usuario autorizador por auth_code
    const autorizador = await this.usuarioRepository.findOne({
      where: { auth_code: auth_code.trim() },
      relations: ['rol'],
    });

    if (!autorizador) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'No se encontró ningún usuario con el auth_code proporcionado',
          code: 'AUTH-VAL-01',
        },
        400,
      );
    }

    // 3. Validar que esté activo
    if (!autorizador.activo) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'El usuario asociado al auth_code no se encuentra activo',
          code: 'AUTH-VAL-02',
        },
        400,
      );
    }

    // 4. Validar que tenga autoriza=true (general)
    if (!autorizador.autoriza) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'El usuario asociado al auth_code no tiene permisos para autorizar (autoriza = false)',
          code: 'AUTH-VAL-03',
        },
        400,
      );
    }

    // 5. Validar autorización específica del permiso
    const permisoRol = await this.permisoRolRepository.findOneBy({
      rolId: autorizador.rolId,
      permisoId,
    });

    let tieneAutorizacion = false;

    if (permisoRol?.autoriza === true) {
      tieneAutorizacion = true;
    } else {
      const permisoUsuario = await this.permisoUsuarioRepository.findOneBy({
        usuarioId: autorizador.id,
        permisoId,
      });

      if (permisoUsuario?.autoriza === true) {
        tieneAutorizacion = true;
      }
    }

    if (!tieneAutorizacion) {
      throw new HttpException(
        {
          statusCode: 400,
          message:
            `El usuario autorizador no tiene autorización para el permiso "${permiso.codigo}" ` +
            `(${permiso.modulo}/${permiso.accion})`,
          code: 'AUTH-VAL-05',
        },
        400,
      );
    }

    // 6. Validar que no sea el mismo usuario (auto-autorización prohibida)
    if (autorizador.id === user.id) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'Un usuario no puede autorizarse a sí mismo',
          code: 'AUTH-VAL-07',
        },
        400,
      );
    }

    this.logger.debug(
      `Autorización validada: ${user.userName} autorizado por ${autorizador.userName} ` +
      `para ${permiso.codigo} (fuente: ${permisoRol?.autoriza ? 'rol' : 'usuario'})`,
    );
  }
}
