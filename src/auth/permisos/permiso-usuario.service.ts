import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PermisoUsuario } from 'database/entities/permisos/permiso-usuario.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  CreatePermisoUsuarioDto,
  UpdatePermisoUsuarioDto,
} from './dto/permiso-usuario.dto';

@Injectable()
export class PermisoUsuarioService extends BaseService {
  constructor(
    @Inject('PERMISO_USUARIO_REPOSITORY')
    private readonly permisoUsuarioRepository: Repository<PermisoUsuario>,
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
        return this.customThrowError(
          null,
          'AUT-104-01',
          'No existe la asignación de permiso para el usuario indicado',
        );
      }
      await this.permisoUsuarioRepository.delete({ usuarioId, permisoId });
      return this.customSuccessResponse(
        null,
        null,
        HttpStatus.OK,
        'Permiso retirado del usuario exitosamente',
        'auth/permisos/usuario',
      );
    } catch (error) {
      this.customThrowError(
        error,
        'AUT-104',
        'Error al retirar permiso del usuario',
      );
    }
  }
}
