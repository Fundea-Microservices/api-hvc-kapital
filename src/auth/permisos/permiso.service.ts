import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreatePermisoDto, UpdatePermisoDto } from './dto/permiso.dto';

@Injectable()
export class PermisoService extends BaseService {
  constructor(
    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,
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
}
