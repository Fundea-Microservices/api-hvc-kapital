import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/common';
import { Repository, Like, Not } from 'typeorm';
import { Config } from 'database/entities/config.entity';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateConfigDto, UpdateConfigDto } from './dto';

@Injectable()
export class ConfigService extends BaseService {
  constructor(
    @Inject('CONFIG_REPOSITORY')
    private readonly configRepository: Repository<Config>,
  ) {
    super();
  }

  protected readonly logger = new Logger('ConfigService');
  onModuleInit() {
    this.logger.log('ConfigService initialized');
  }

  // AUT-80
  async create(createConfigDto: CreateConfigDto) {
    try {
      // Validar duplicado por llave
      const existing = await this.configRepository.findOne({
        where: { llave: createConfigDto.llave },
      });
      if (existing) {
        return this.customThrowError(
          '',
          'AUT-80-01',
          `Ya existe una configuración con la llave ${createConfigDto.llave}`,
        );
      }

      const cfg = this.configRepository.create({
        ...createConfigDto,
        activo: createConfigDto.activo ?? true,
      });
      const saved = await this.configRepository.save(cfg);

      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Configuración creada exitosamente',
        'auth/config',
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
      this.customThrowError(error, 'AUT-80', 'Error al crear configuración');
    }
  }

  // AUT-81
  async findAll(paginationDto: PaginationActiveDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        activo,
      } = paginationDto as any;

      const where: any = {};
      if (busqueda) {
        // Buscar por llave o descripcion
        where.llave = Like(`%${busqueda}%`);
      }
      if (activo !== undefined) {
        where.activo = activo;
      }

      const [data, total] = await this.configRepository.findAndCount({
        where,
        take: limit,
        skip: (page - 1) * limit,
        order: { created_at: 'DESC' },
      });

      const metadata = { total, page, limit };
      return this.customSuccessResponse(
        data,
        metadata,
        HttpStatus.OK,
        'Configuraciones listadas correctamente',
        'auth/config',
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
      this.customThrowError(error, 'AUT-81', 'Error listando configuraciones');
    }
  }

  // AUT-82
  async findOne(id: string) {
    try {
      const cfg = await this.configRepository.findOne({
        where: { id },
      });
      if (!cfg) {
        return this.customThrowError(
          '',
          'AUT-82-01',
          `Configuración con ID ${id} no encontrada`,
        );
      }
      return this.customSuccessResponse(
        cfg,
        null,
        HttpStatus.OK,
        'Configuración encontrada',
        'auth/config',
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
      this.customThrowError(error, 'AUT-82', 'Error obteniendo configuración');
    }
  }

  // AUT-85
  async findByLlave(llave: string) {
    try {
      const cfg = await this.configRepository.findOne({ where: { llave } });
      if (!cfg) {
        return this.customThrowError(
          '',
          'AUT-85-01',
          `Configuración con llave ${llave} no encontrada`,
        );
      }
      return this.customSuccessResponse(
        cfg,
        null,
        HttpStatus.OK,
        'Configuración encontrada',
        'auth/config',
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
      this.customThrowError(
        error,
        'AUT-85',
        'Error obteniendo configuración por llave',
      );
    }
  }

  // AUT-83
  async update(id: string, updateConfigDto: UpdateConfigDto) {
    try {
      const cfg = await this.configRepository.findOne({
        where: { id },
      });
      if (!cfg) {
        return this.customThrowError(
          '',
          'AUT-83-01',
          `Configuración con ID ${id} no encontrada`,
        );
      }

      // Validar duplicado de llave si cambia
      if (updateConfigDto.llave && updateConfigDto.llave !== cfg.llave) {
        const dupe = await this.configRepository.findOne({
          where: { llave: updateConfigDto.llave, id: Not(id) as any },
        });
        if (dupe) {
          return this.customThrowError(
            '',
            'AUT-83-02',
            `Ya existe otra configuración con la llave ${updateConfigDto.llave}`,
          );
        }
      }

      Object.assign(cfg, updateConfigDto);
      const saved = await this.configRepository.save(cfg);
      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.OK,
        'Configuración actualizada',
        'auth/config',
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
      this.customThrowError(
        error,
        'AUT-83',
        'Error actualizando configuración',
      );
    }
  }

  // AUT-84
  async remove(id: string) {
    try {
      const cfg = await this.configRepository.findOne({
        where: { id },
      });
      if (!cfg) {
        return this.customThrowError(
          '',
          'AUT-84-01',
          `Configuración con ID ${id} no encontrada`,
        );
      }

      // Preferimos soft delete para mantener historial
      await this.configRepository.softDelete({ id });
      return this.customSuccessResponse(
        cfg,
        null,
        HttpStatus.OK,
        'Configuración eliminada',
        'auth/config',
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
      this.customThrowError(error, 'AUT-84', 'Error eliminando configuración');
    }
  }
}
