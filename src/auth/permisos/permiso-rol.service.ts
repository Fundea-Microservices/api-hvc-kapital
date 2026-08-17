import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PermisoRol } from 'database/entities/permisos/permiso-rol.entity';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreatePermisoRolDto, MatrizPermisoRolDto } from './dto/permiso-rol.dto';

@Injectable()
export class PermisoRolService extends BaseService {
  constructor(
    @Inject('PERMISO_ROL_REPOSITORY')
    private readonly permisoRolRepository: Repository<PermisoRol>,
    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,
  ) {
    super();
  }

  protected readonly logger = new Logger('PermisoRolService');

  // AUT-95
  async create(createDto: CreatePermisoRolDto) {
    try {
      const existente = await this.permisoRolRepository.findOneBy({
        rolId: createDto.rolId,
        permisoId: createDto.permisoId,
      });
      if (existente) {
        return this.customThrowError(
          null,
          'AUT-95-01',
          'El permiso ya se encuentra asignado a este rol',
        );
      }

      const permisoRol = this.permisoRolRepository.create(createDto);
      const saved = await this.permisoRolRepository.save(permisoRol);
      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Permiso asignado al rol exitosamente',
        'auth/permisos/rol',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-95', 'Error al asignar permiso al rol');
    }
  }

  // AUT-96
  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit, busqueda, todos } = paginationDto;

      if (todos) {
        const [data, total] = await this.permisoRolRepository.findAndCount({
          where: busqueda ? { rolId: busqueda } : {},
          relations: { permiso: true },
        });
        return this.customSuccessResponse(
          data,
          { total, page: 1, limit: total },
          HttpStatus.OK,
          'Permisos del rol listados correctamente',
          'auth/permisos/rol',
        );
      }

      const [data, total] = await this.permisoRolRepository.findAndCount({
        where: busqueda ? { rolId: busqueda } : {},
        relations: { permiso: true },
        skip: (page - 1) * limit,
        take: limit,
      });

      return this.customSuccessResponse(
        data,
        { total, page, limit },
        HttpStatus.OK,
        'Permisos del rol listados correctamente',
        'auth/permisos/rol',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-96', 'Error al listar permisos del rol');
    }
  }

  // AUT-99
  // Devuelve TODOS los permisos (paginados/filtrados) marcando cuáles tiene asignados el rol
  async getMatrizByRol(dto: MatrizPermisoRolDto) {
    try {
      const { rolId, page, limit, modulo, accion, codigo, todos } = dto;

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

      if (!todos) {
        qb.skip((page - 1) * limit).take(limit);
      }

      const [permisos, total] = await qb.getManyAndCount();

      // Permisos actualmente asignados al rol
      const asignados = await this.permisoRolRepository.find({
        where: { rolId },
        select: { permisoId: true },
      });
      const asignadosSet = new Set(asignados.map((a) => a.permisoId));

      const data = permisos.map((permiso) => ({
        ...permiso,
        asignado: asignadosSet.has(permiso.id),
      }));

      return this.customSuccessResponse(
        data,
        todos
          ? { total, page: 1, limit: total }
          : { total, page, limit },
        HttpStatus.OK,
        'Matriz de permisos del rol generada correctamente',
        'auth/permisos/rol/matriz',
      );
    } catch (error) {
      this.customThrowError(
        error,
        'AUT-99',
        'Error al generar la matriz de permisos del rol',
      );
    }
  }

  // AUT-97
  async findOne(rolId: string, permisoId: string) {
    try {
      const permisoRol = await this.permisoRolRepository.findOne({
        where: { rolId, permisoId },
        relations: { permiso: true },
      });
      if (!permisoRol) {
        return this.customThrowError(
          null,
          'AUT-97-01',
          'No existe la asignación de permiso para el rol indicado',
        );
      }
      return this.customSuccessResponse(
        permisoRol,
        null,
        HttpStatus.OK,
        'Asignación encontrada',
        'auth/permisos/rol',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-97', 'Error al buscar la asignación');
    }
  }

  // AUT-98
  async remove(rolId: string, permisoId: string) {
    try {
      const permisoRol = await this.permisoRolRepository.findOneBy({
        rolId,
        permisoId,
      });
      if (!permisoRol) {
        return this.customThrowError(
          null,
          'AUT-98-01',
          'No existe la asignación de permiso para el rol indicado',
        );
      }
      await this.permisoRolRepository.delete({ rolId, permisoId });
      return this.customSuccessResponse(
        null,
        null,
        HttpStatus.OK,
        'Permiso retirado del rol exitosamente',
        'auth/permisos/rol',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-98', 'Error al retirar permiso del rol');
    }
  }
}
