import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/common';
import { Brackets, Not, Repository } from 'typeorm';
import { Config } from 'database/entities/config.entity';
import { ConfigPolitica } from 'database/entities/config-politica.entity';
import {
  CreateConfigDto,
  PaginationConfigDto,
  UpdateConfigDto,
} from './dto';
import { AuthorizationExecutorService } from '../usuarios/authorization-executor.service';

@Injectable()
export class ConfigService extends BaseService {
  constructor(
    @Inject('CONFIG_REPOSITORY')
    private readonly configRepository: Repository<Config>,

    @Inject('CONFIG_POLITICA_REPOSITORY')
    private readonly politicaRepository: Repository<ConfigPolitica>,

    private readonly executor: AuthorizationExecutorService,
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

      await this.validarPoliticaActiva(
        createConfigDto.politicaId,
        'AUT-80-02',
        'AUT-80-03',
        'AUT-80-04',
      );

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

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
      // El 428 del punto de autorización debe llegar intacto al filtro
      // global (patrón de usuarios.service.ts): no se reenvuelve.
      if (error instanceof HttpException) throw error;
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
  async findAll(paginationDto: PaginationConfigDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        activo,
        todos,
        moduloId,
        politicaId,
      } = paginationDto;

      const qb = this.configRepository
        .createQueryBuilder('c')
        // Relaciones para que la tabla del frontend pinte Módulo y Política.
        .leftJoinAndSelect('c.politica', 'politica')
        .leftJoinAndSelect('politica.modulo', 'modulo');

      if (busqueda) {
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where('c.llave LIKE :busqueda')
              .orWhere('c.descripcion LIKE :busqueda');
          }),
          { busqueda: `%${busqueda}%` },
        );
      }

      if (activo !== undefined) {
        qb.andWhere('c.activo = :activo', { activo });
      }

      if (politicaId) {
        qb.andWhere('c.politicaId = :politicaId', { politicaId });
      }

      // El módulo vive en la política: se filtra atravesando la relación.
      if (moduloId) {
        qb.andWhere('politica.moduloId = :moduloId', { moduloId });
      }

      qb.orderBy('c.created_at', 'DESC');

      if (!todos) {
        qb.skip((page - 1) * limit).take(limit);
      }

      const [data, total] = await qb.getManyAndCount();

      const metadata = todos
        ? { total, page: 1, limit: total }
        : { total, page, limit };
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
        relations: { politica: { modulo: true } },
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
      const cfg = await this.configRepository.findOne({
        where: { llave },
        relations: { politica: { modulo: true } },
      });
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

      // Al reasignar política se exige que exista y esté activa, igual que
      // en la creación.
      if (updateConfigDto.politicaId) {
        await this.validarPoliticaActiva(
          updateConfigDto.politicaId,
          'AUT-83-03',
          'AUT-83-04',
          'AUT-83-05',
        );
      }

      // PUNTO DE CONTROL: validaciones y búsquedas completadas,
      // justo antes de la primera escritura en la base de datos.
      await this.executor.verificarPuntoDeAutorizacion();

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
      if (error instanceof HttpException) throw error;
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

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

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
      if (error instanceof HttpException) throw error;
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

  /**
   * Verifica que la política y su módulo existan y estén activos antes de
   * asociar parámetros.
   * Los códigos de error se reciben para conservar la numeración de cada
   * operación (alta vs. actualización).
   */
  private async validarPoliticaActiva(
    politicaId: string,
    codigoNoExiste: string,
    codigoInactiva: string,
    codigoModuloInactivo: string,
  ): Promise<void> {
    const politica = await this.politicaRepository.findOne({
      where: { id: politicaId },
      relations: { modulo: true },
    });

    if (!politica) {
      return this.customThrowError(
        '',
        codigoNoExiste,
        `Política de configuración con ID ${politicaId} no encontrada`,
      );
    }

    if (!politica.activo) {
      return this.customThrowError(
        '',
        codigoInactiva,
        `La política ${politica.codigo} está inactiva; no puede asociarse a nuevos parámetros`,
      );
    }

    // El módulo de la política también debe estar vigente: un módulo
    // desactivado no admite parámetros nuevos, igual que una política
    // inactiva.
    if (!politica.modulo || !politica.modulo.activo) {
      return this.customThrowError(
        '',
        codigoModuloInactivo,
        `El módulo ${politica.modulo?.codigo ?? politica.moduloId} está inactivo; no puede asociarse a nuevos parámetros`,
      );
    }
  }
}
