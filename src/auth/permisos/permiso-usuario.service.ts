import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PermisoUsuario } from 'database/entities/permisos/permiso-usuario.entity';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { PermisoRol } from 'database/entities/permisos/permiso-rol.entity';
import { Usuario } from 'database/entities/usuario.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  CreatePermisoUsuarioDto,
  MatrizPermisoUsuarioDto,
  TipoAsignacionEnum,
  UpdatePermisoUsuarioDto,
} from './dto';
import { AuthorizationExecutorService } from '../usuarios/authorization-executor.service';

@Injectable()
export class PermisoUsuarioService extends BaseService {
  constructor(
    @Inject('PERMISO_USUARIO_REPOSITORY')
    private readonly permisoUsuarioRepository: Repository<PermisoUsuario>,

    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,

    @Inject('PERMISO_ROL_REPOSITORY')
    private readonly permisoRolRepository: Repository<PermisoRol>,

    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  protected readonly logger = new Logger('PermisoUsuarioService');

  // AUT-100
  async create(createDto: CreatePermisoUsuarioDto) {
    try {
      const existente = await this.permisoUsuarioRepository.findOneBy({
        usuarioId: createDto.usuarioId,
        permisoId: createDto.permisoId,
      });
      if (existente) {
        return this.customThrowError(
          null,
          'AUT-100-01',
          'El permiso ya se encuentra asignado a este usuario',
        );
      }

      // Validación preventiva de redundancia: la BD solo debe registrar en
      // Permiso_Usuario excepciones reales. Si el rol del usuario ya tiene el
      // permiso en Permiso_Rol, la asignación directa está prohibida.
      const usuario = await this.usuarioRepository.findOne({
        where: { id: createDto.usuarioId },
        select: { id: true, rolId: true },
      });
      if (!usuario) {
        return this.customThrowError(
          null,
          'AUT-100-03',
          'No existe el usuario indicado',
        );
      }

      const heredadoDelRol = await this.permisoRolRepository.findOneBy({
        rolId: usuario.rolId,
        permisoId: createDto.permisoId,
      });
      if (heredadoDelRol) {
        return this.customThrowError(
          null,
          'AUT-100-02',
          'El usuario ya tiene asignado este permiso a través de su rol',
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const permisoUsuario = this.permisoUsuarioRepository.create(createDto);
      const saved = await this.permisoUsuarioRepository.save(permisoUsuario);
      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Permiso asignado al usuario exitosamente',
        'auth/permisos/usuario',
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.customThrowError(
        error,
        'AUT-100',
        'Error al asignar permiso al usuario',
      );
    }
  }

  // AUT-101
  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit, busqueda, todos } = paginationDto;

      if (todos) {
        const [data, total] = await this.permisoUsuarioRepository.findAndCount({
          where: busqueda ? { usuarioId: busqueda } : {},
          relations: { permiso: true },
        });
        return this.customSuccessResponse(
          data,
          { total, page: 1, limit: total },
          HttpStatus.OK,
          'Permisos del usuario listados correctamente',
          'auth/permisos/usuario',
        );
      }

      const [data, total] = await this.permisoUsuarioRepository.findAndCount({
        where: busqueda ? { usuarioId: busqueda } : {},
        relations: { permiso: true },
        skip: (page - 1) * limit,
        take: limit,
      });

      return this.customSuccessResponse(
        data,
        { total, page, limit },
        HttpStatus.OK,
        'Permisos del usuario listados correctamente',
        'auth/permisos/usuario',
      );
    } catch (error) {
      this.customThrowError(
        error,
        'AUT-101',
        'Error al listar permisos del usuario',
      );
    }
  }

  async getMatrizByUsuario(dto: MatrizPermisoUsuarioDto) {
    try {
      const {
        usuarioId,
        page,
        limit,
        modulo,
        accion,
        codigo,
        todos,
        asignado,
        tipoAsignacion,
      } = dto;

      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
        select: { id: true, rolId: true },
      });
      if (!usuario) {
        return this.customThrowError(
          null,
          'AUT-106-01',
          'No existe el usuario indicado',
        );
      }

      // Permisos efectivos del usuario, con la MISMA precedencia que PermissionsGuard:
      // 1) Si existe excepción directa (Permiso_Usuario), su campo `permitido` decide.
      // 2) En caso contrario, la asignación del rol (Permiso_Rol) decide.
      const [directos, porRol] = await Promise.all([
        this.permisoUsuarioRepository.find({
          where: { usuarioId },
          select: { permisoId: true, permitido: true },
        }),
        this.permisoRolRepository.find({
          where: { rolId: usuario.rolId },
          select: { permisoId: true },
        }),
      ]);

      const excepciones = new Map(
        directos.map((d) => [d.permisoId, d.permitido === true]),
      );

      const efectivos = new Set<string>();
      for (const [permisoId, permitido] of excepciones) {
        if (permitido) efectivos.add(permisoId);
      }
      for (const { permisoId } of porRol) {
        if (!excepciones.has(permisoId)) efectivos.add(permisoId);
      }

      const porRolIds = new Set(porRol.map((p) => p.permisoId));
      const resolveTipoAsignacion = (permisoId: string): TipoAsignacionEnum => {
        if (excepciones.has(permisoId)) return TipoAsignacionEnum.USUARIO;
        if (porRolIds.has(permisoId)) return TipoAsignacionEnum.ROL;
        return TipoAsignacionEnum.NO_ASIGNADO;
      };

      const qb = this.permisoRepository
        .createQueryBuilder('permiso')
        .orderBy('permiso.modulo', 'ASC')
        .addOrderBy('permiso.accion', 'ASC');

      if (codigo) {
        qb.andWhere('permiso.codigo LIKE :codigo', { codigo: `%${codigo}%` });
      }

      if (modulo) {
        qb.andWhere(
          '(permiso.modulo LIKE :modulo OR permiso.descripcion LIKE :modulo)',
          { modulo: `%${modulo}%` },
        );
      }

      if (accion) {
        qb.andWhere(
          '(permiso.accion LIKE :accion OR permiso.descripcion LIKE :accion)',
          { accion: `%${accion}%` },
        );
      }

      // Filtro por estado de asignación: se aplica en SQL ANTES del skip/take,
      // para que total y paginación sean coherentes con el filtro.
      // El catálogo de permisos es pequeño, por lo que el IN/NOT IN es seguro.
      if (asignado !== undefined) {
        const efectivosIds = [...efectivos];

        if (asignado) {
          if (efectivosIds.length === 0) {
            qb.andWhere('1 = 0'); // ningún permiso efectivo: matriz vacía
          } else {
            qb.andWhere('permiso.id IN (:...efectivosIds)', { efectivosIds });
          }
        } else if (efectivosIds.length > 0) {
          qb.andWhere('permiso.id NOT IN (:...efectivosIds)', { efectivosIds });
        }
        // asignado=false con lista vacía: todos califican, no se agrega filtro
      }

      if (tipoAsignacion !== undefined) {
        if (tipoAsignacion === TipoAsignacionEnum.NO_ASIGNADO) {
          // Sin fila directa ni de rol: NOT IN sobre la unión de ambos orígenes.
          const decididosIds = [
            ...new Set([...excepciones.keys(), ...porRolIds]),
          ];
          if (decididosIds.length > 0) {
            qb.andWhere('permiso.id NOT IN (:...decididosIds)', {
              decididosIds,
            });
          }
          // Lista vacía: ningún permiso tiene origen => todo el catálogo califica.
        } else {
          let idsTipo: string[];
          if (tipoAsignacion === TipoAsignacionEnum.USUARIO) {
            idsTipo = [...excepciones.keys()];
          } else {
            // ROL: heredados que NO están sobreescritos por una excepción directa.
            idsTipo = [...porRolIds].filter((id) => !excepciones.has(id));
          }

          if (idsTipo.length === 0) {
            qb.andWhere('1 = 0'); // ningún permiso en ese estado: matriz vacía
          } else {
            qb.andWhere('permiso.id IN (:...idsTipo)', { idsTipo });
          }
        }
      }

      if (!todos) {
        qb.skip((page - 1) * limit).take(limit);
      }

      const [permisos, total] = await qb.getManyAndCount();

      const data = permisos.map((permiso) => {
        const origen = resolveTipoAsignacion(permiso.id);
        return {
          ...permiso,
          asignado: efectivos.has(permiso.id),
          tipoAsignacion: origen,
          origen,
        };
      });

      return this.customSuccessResponse(
        data,
        todos
          ? { total, page: 1, limit: total }
          : { total, page, limit },
        HttpStatus.OK,
        'Matriz de permisos efectivos del usuario generada correctamente',
        'auth/permisos/usuario/matriz',
      );
    } catch (error) {
      this.customThrowError(
        error,
        'AUT-106',
        'Error al generar la matriz de permisos del usuario',
      );
    }
  }

  // AUT-102
  async findOne(usuarioId: string, permisoId: string) {
    try {
      const permisoUsuario = await this.permisoUsuarioRepository.findOne({
        where: { usuarioId, permisoId },
        relations: { permiso: true },
      });
      if (!permisoUsuario) {
        return this.customThrowError(
          null,
          'AUT-102-01',
          'No existe la asignación de permiso para el usuario indicado',
        );
      }
      return this.customSuccessResponse(
        permisoUsuario,
        null,
        HttpStatus.OK,
        'Asignación encontrada',
        'auth/permisos/usuario',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-102', 'Error al buscar la asignación');
    }
  }

  // AUT-103
  async update(
    usuarioId: string,
    permisoId: string,
    updateDto: UpdatePermisoUsuarioDto,
  ) {
    try {
      const permisoUsuario = await this.permisoUsuarioRepository.findOneBy({
        usuarioId,
        permisoId,
      });
      if (!permisoUsuario) {
        return this.customThrowError(
          null,
          'AUT-103-01',
          'No existe la asignación de permiso para el usuario indicado',
        );
      }
      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.permisoUsuarioRepository.update(
        { usuarioId, permisoId },
        updateDto,
      );
      const updated = await this.permisoUsuarioRepository.findOne({
        where: { usuarioId, permisoId },
        relations: { permiso: true },
      });
      return this.customSuccessResponse(
        updated,
        null,
        HttpStatus.OK,
        'Asignación actualizada correctamente',
        'auth/permisos/usuario',
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.customThrowError(
        error,
        'AUT-103',
        'Error al actualizar la asignación',
      );
    }
  }

  // AUT-104
  async remove(usuarioId: string, permisoId: string) {
    try {
      const permisoUsuario = await this.permisoUsuarioRepository.findOneBy({
        usuarioId,
        permisoId,
      });
      if (!permisoUsuario) {
        const usuario = await this.usuarioRepository.findOne({
          where: { id: usuarioId },
          select: { id: true, rolId: true },
        });
        if (usuario) {
          const heredadoDelRol = await this.permisoRolRepository.findOneBy({
            rolId: usuario.rolId,
            permisoId,
          });
          if (heredadoDelRol) {
            return this.customThrowError(
              null,
              'AUT-104-02',
              'El usuario ya tiene asignado este permiso a través de su rol',
            );
          }
        }
        return this.customThrowError(
          null,
          'AUT-104-01',
          'No existe la asignación de permiso para el usuario indicado',
        );
      }
      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.permisoUsuarioRepository.delete({ usuarioId, permisoId });
      return this.customSuccessResponse(
        null,
        null,
        HttpStatus.OK,
        'Permiso retirado del usuario exitosamente',
        'auth/permisos/usuario',
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.customThrowError(
        error,
        'AUT-104',
        'Error al retirar permiso del usuario',
      );
    }
  }

  /**
   * Verifica si un usuario tiene autorización (autoriza = true) directa para un permiso específico.
   * @param usuarioId UUID del usuario a verificar
   * @param permisoId UUID del permiso a verificar
   * @returns true si el usuario tiene autoriza=true para el permiso, false en caso contrario
   */
  async tieneAutorizacion(usuarioId: string, permisoId: string): Promise<boolean> {
    try {
      const permisoUsuario = await this.permisoUsuarioRepository.findOneBy({
        usuarioId,
        permisoId,
      });
      return permisoUsuario?.autoriza === true;
    } catch (error) {
      this.logger.error(
        `Error al verificar autorización del usuario ${usuarioId} para el permiso ${permisoId}`,
        error,
      );
      return false;
    }
  }
}
