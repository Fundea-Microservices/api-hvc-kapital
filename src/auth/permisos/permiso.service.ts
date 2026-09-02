import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { PermisoRol } from 'database/entities/permisos/permiso-rol.entity';
import { PermisoUsuario } from 'database/entities/permisos/permiso-usuario.entity';
import { Usuario } from 'database/entities/usuario.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreatePermisoDto, UpdatePermisoDto } from './dto/permiso.dto';

@Injectable()
export class PermisoService extends BaseService {
  constructor(
    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,
    @Inject('PERMISO_ROL_REPOSITORY')
    private readonly permisoRolRepository: Repository<PermisoRol>,
    @Inject('PERMISO_USUARIO_REPOSITORY')
    private readonly permisoUsuarioRepository: Repository<PermisoUsuario>,
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,
  ) {
    super();
  }

  protected readonly logger = new Logger('PermisoService');

  // AUT-90
  async create(createDto: CreatePermisoDto) {
    try {
      createDto.codigo = createDto.codigo.toUpperCase();
      createDto.accion = createDto.accion.toUpperCase();

      const existente = await this.permisoRepository.findOneBy({
        codigo: createDto.codigo,
      });
      if (existente) {
        return this.customThrowError(
          null,
          'AUT-90-01',
          `Ya existe un permiso con el código ${createDto.codigo}`,
        );
      }

      const permiso = this.permisoRepository.create(createDto);
      const saved = await this.permisoRepository.save(permiso);
      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Permiso creado exitosamente',
        'auth/permisos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-90', 'Error al crear permiso');
    }
  }

  // AUT-91
  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit, busqueda, todos } = paginationDto;

      if (todos) {
        const [data, total] = await this.permisoRepository.findAndCount({
          order: { modulo: 'ASC', accion: 'ASC' },
        });
        return this.customSuccessResponse(
          data,
          { total, page: 1, limit: total },
          HttpStatus.OK,
          'Permisos listados correctamente',
          'auth/permisos',
        );
      }

      const [data, total] = await this.permisoRepository.findAndCount({
        where: busqueda ? { codigo: Like(`%${busqueda}%`) } : {},
        skip: (page - 1) * limit,
        take: limit,
        order: { modulo: 'ASC', accion: 'ASC' },
      });

      return this.customSuccessResponse(
        data,
        { total, page, limit },
        HttpStatus.OK,
        'Permisos listados correctamente',
        'auth/permisos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-91', 'Error al listar permisos');
    }
  }

  // AUT-92
  async findOne(id: string) {
    try {
      const permiso = await this.permisoRepository.findOneBy({ id });
      if (!permiso) {
        return this.customThrowError(
          null,
          'AUT-92-01',
          `Permiso con ID ${id} no encontrado`,
        );
      }
      return this.customSuccessResponse(
        permiso,
        null,
        HttpStatus.OK,
        'Permiso encontrado',
        'auth/permisos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-92', 'Error al buscar permiso');
    }
  }

  // AUT-93
  async update(id: string, updateDto: UpdatePermisoDto) {
    try {
      const permiso = await this.permisoRepository.findOneBy({ id });
      if (!permiso) {
        return this.customThrowError(
          null,
          'AUT-93-01',
          `Permiso con ID ${id} no encontrado`,
        );
      }

      if (updateDto.accion) {
        updateDto.accion = updateDto.accion.toUpperCase();
      }

      if (updateDto.codigo) {
        updateDto.codigo = updateDto.codigo.toUpperCase();
        const existente = await this.permisoRepository.findOneBy({
          codigo: updateDto.codigo,
        });
        if (existente && existente.id !== id) {
          return this.customThrowError(
            null,
            'AUT-93-02',
            `Ya existe un permiso con el código ${updateDto.codigo}`,
          );
        }
      }

      // permisoId no es actualizable
      delete updateDto.permisoId;
      await this.permisoRepository.update(id, updateDto);
      const updated = await this.permisoRepository.findOneBy({ id });
      return this.customSuccessResponse(
        updated,
        null,
        HttpStatus.OK,
        'Permiso actualizado correctamente',
        'auth/permisos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-93', 'Error al actualizar permiso');
    }
  }

  // AUT-94
  async remove(id: string) {
    try {
      const permiso = await this.permisoRepository.findOneBy({ id });
      if (!permiso) {
        return this.customThrowError(
          null,
          'AUT-94-01',
          `Permiso con ID ${id} no encontrado`,
        );
      }
      await this.permisoRepository.delete(id);
      return this.customSuccessResponse(
        null,
        null,
        HttpStatus.OK,
        'Permiso eliminado exitosamente',
        'auth/permisos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-94', 'Error al eliminar permiso');
    }
  }

  // AUT-105
  /**
   * Verifica si un usuario tiene autorización para un permiso específico.
   * Primero verifica la tabla Permiso_Rol (por el rol del usuario);
   * si no tiene autorización ahí, verifica la tabla Permiso_Usuario (asignación directa).
   *
   * @param usuarioId UUID del usuario a verificar
   * @param permisoId UUID del permiso a verificar
   * @returns Objeto con tieneAutorizacion (boolean) y fuente ('rol' | 'usuario' | null)
   */
  async verificarAutorizacion(usuarioId: string, permisoId: string) {
    try {
      // 1. Obtener el usuario para conocer su rolId
      const usuario = await this.usuarioRepository.findOneBy({ id: usuarioId });
      if (!usuario) {
        return this.customThrowError(
          null,
          'AUT-105-01',
          `Usuario con ID ${usuarioId} no encontrado`,
        );
      }

      // 2. Verificar si el permiso existe
      const permiso = await this.permisoRepository.findOneBy({ id: permisoId });
      if (!permiso) {
        return this.customThrowError(
          null,
          'AUT-105-02',
          `Permiso con ID ${permisoId} no encontrado`,
        );
      }

      // 3. Verificar Permiso_Rol: ¿el rol del usuario tiene autoriza=true para este permiso?
      const permisoRol = await this.permisoRolRepository.findOneBy({
        rolId: usuario.rolId,
        permisoId,
      });
      if (permisoRol?.autoriza === true) {
        return this.customSuccessResponse(
          { tieneAutorizacion: true, fuente: 'rol', permisoCodigo: permiso.codigo },
          null,
          HttpStatus.OK,
          'El usuario tiene autorización para este permiso a través de su rol',
          'auth/permisos/verificar-autorizacion',
        );
      }

      // 4. Verificar Permiso_Usuario: ¿el usuario tiene autoriza=true directamente para este permiso?
      const permisoUsuario = await this.permisoUsuarioRepository.findOneBy({
        usuarioId,
        permisoId,
      });
      if (permisoUsuario?.autoriza === true) {
        return this.customSuccessResponse(
          { tieneAutorizacion: true, fuente: 'usuario', permisoCodigo: permiso.codigo },
          null,
          HttpStatus.OK,
          'El usuario tiene autorización directa para este permiso',
          'auth/permisos/verificar-autorizacion',
        );
      }

      // 5. No tiene autorización
      return this.customSuccessResponse(
        { tieneAutorizacion: false, fuente: null, permisoCodigo: permiso.codigo },
        null,
        HttpStatus.OK,
        'El usuario NO tiene autorización para este permiso (ni por rol ni directamente)',
        'auth/permisos/verificar-autorizacion',
      );
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        error.statusCode &&
        error.success === false
      ) {
        throw error;
      }
      this.customThrowError(error, 'AUT-105', 'Error al verificar autorización del permiso');
    }
  }
}
