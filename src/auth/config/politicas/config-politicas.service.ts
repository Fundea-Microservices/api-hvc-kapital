import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, Not, Repository } from 'typeorm';
import { ConfigModulo } from 'database/entities/config-modulo.entity';
import { ConfigPolitica } from 'database/entities/config-politica.entity';
import { Config } from 'database/entities/config.entity';
import { BaseService } from 'src/common';
import {
  CreateConfigPoliticaDto,
  PaginationConfigPoliticaDto,
  ReorderConfigPoliticaDto,
  UpdateConfigPoliticaDto,
} from '../dto';
import { AuthorizationExecutorService } from '../../usuarios/authorization-executor.service';

const PATH = 'config/politicas';

@Injectable()
export class ConfigPoliticasService extends BaseService {
  constructor(
    @Inject('CONFIG_POLITICA_REPOSITORY')
    private readonly politicaRepository: Repository<ConfigPolitica>,

    @Inject('CONFIG_MODULO_REPOSITORY')
    private readonly moduloRepository: Repository<ConfigModulo>,

    @Inject('CONFIG_REPOSITORY')
    private readonly configRepository: Repository<Config>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  protected readonly logger = new Logger('ConfigPoliticasService');
  onModuleInit() {
    this.logger.log('ConfigPoliticasService initialized');
  }

  // AUT-117
  async create(createDto: CreateConfigPoliticaDto) {
    try {
      const existente = await this.politicaRepository.findOne({
        where: { codigo: createDto.codigo },
      });
      if (existente) {
        return this.customThrowError(
          '',
          'AUT-117-01',
          `Ya existe una política de configuración con el código ${createDto.codigo}`,
        );
      }

      const modulo = await this.moduloRepository.findOne({
        where: { id: createDto.moduloId },
      });
      if (!modulo) {
        return this.customThrowError(
          '',
          'AUT-117-02',
          `Módulo de configuración con ID ${createDto.moduloId} no encontrado`,
        );
      }

      // Si el cliente no envía orden, se ubica al final del módulo. Un orden
      // explícito debe estar libre dentro de ese mismo módulo.
      const orden =
        createDto.orden ??
        (await this.obtenerSiguienteOrden(createDto.moduloId));
      const ordenOcupado = await this.politicaRepository.findOne({
        where: { moduloId: createDto.moduloId, orden },
      });
      if (ordenOcupado) {
        return this.customThrowError(
          '',
          'AUT-117-03',
          `El orden ${orden} ya está ocupado por la política ${ordenOcupado.codigo} en este módulo. Seleccione un orden disponible.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const politica = this.politicaRepository.create({
        ...createDto,
        orden,
        activo: createDto.activo ?? true,
      });
      const saved = await this.politicaRepository.save(politica);

      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Política de configuración creada exitosamente',
        PATH,
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
        'AUT-117',
        'Error al crear política de configuración',
      );
    }
  }

  // AUT-118
  async findAll(paginationDto: PaginationConfigPoliticaDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        activo,
        todos,
        moduloId,
      } = paginationDto;

      const qb = this.politicaRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.modulo', 'modulo');

      if (busqueda) {
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where('p.codigo LIKE :busqueda')
              .orWhere('p.nombre LIKE :busqueda')
              .orWhere('p.descripcion LIKE :busqueda');
          }),
          { busqueda: `%${busqueda}%` },
        );
      }

      if (activo !== undefined) {
        qb.andWhere('p.activo = :activo', { activo });
      }

      // Filtro del combo dependiente Módulo → Política de la UI.
      if (moduloId) {
        qb.andWhere('p.moduloId = :moduloId', { moduloId });
      }

      qb.orderBy('p.orden', 'ASC').addOrderBy('p.nombre', 'ASC');

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
        'Políticas de configuración listadas correctamente',
        PATH,
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
        'AUT-118',
        'Error listando políticas de configuración',
      );
    }
  }

  // AUT-119
  async findOne(id: string) {
    try {
      const politica = await this.politicaRepository.findOne({
        where: { id },
        relations: { modulo: true },
      });
      if (!politica) {
        return this.customThrowError(
          '',
          'AUT-119-01',
          `Política de configuración con ID ${id} no encontrada`,
        );
      }

      return this.customSuccessResponse(
        politica,
        null,
        HttpStatus.OK,
        'Política de configuración encontrada',
        PATH,
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
        'AUT-119',
        'Error obteniendo política de configuración',
      );
    }
  }

  /**
   * Resuelve el módulo padre de una política. Permite al frontend
   * preseleccionar el combo de Módulo cuando solo conoce `politicaId`
   * (por ejemplo, al editar un parámetro `Config`).
   */
  // AUT-120
  async findModuloByPolitica(politicaId: string) {
    try {
      const politica = await this.politicaRepository.findOne({
        where: { id: politicaId },
        relations: { modulo: true },
      });
      if (!politica || !politica.modulo) {
        throw new NotFoundException(
          `Política de configuración con ID ${politicaId} no encontrada`,
        );
      }

      const { modulo } = politica;
      return this.customSuccessResponse(
        {
          politicaId: politica.id,
          moduloId: politica.moduloId,
          modulo: {
            id: modulo.id,
            codigo: modulo.codigo,
            nombre: modulo.nombre,
            activo: modulo.activo,
          },
        },
        null,
        HttpStatus.OK,
        'Módulo obtenido correctamente a partir de la política',
        PATH,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.customThrowError(
        error,
        'AUT-120',
        'Error obteniendo el módulo de la política',
      );
    }
  }

  // AUT-121
  async update(id: string, updateDto: UpdateConfigPoliticaDto) {
    try {
      const politica = await this.politicaRepository.findOne({ where: { id } });
      if (!politica) {
        return this.customThrowError(
          '',
          'AUT-121-01',
          `Política de configuración con ID ${id} no encontrada`,
        );
      }

      if (updateDto.codigo && updateDto.codigo !== politica.codigo) {
        const duplicado = await this.politicaRepository.findOne({
          where: { codigo: updateDto.codigo, id: Not(id) },
        });
        if (duplicado) {
          return this.customThrowError(
            '',
            'AUT-121-02',
            `Ya existe otra política de configuración con el código ${updateDto.codigo}`,
          );
        }
      }

      if (updateDto.moduloId && updateDto.moduloId !== politica.moduloId) {
        const modulo = await this.moduloRepository.findOne({
          where: { id: updateDto.moduloId },
        });
        if (!modulo) {
          return this.customThrowError(
            '',
            'AUT-121-03',
            `Módulo de configuración con ID ${updateDto.moduloId} no encontrado`,
          );
        }
      }

      // PUNTO DE CONTROL: validaciones completadas, antes de la escritura.
      await this.executor.verificarPuntoDeAutorizacion();

      Object.assign(politica, updateDto);
      const saved = await this.politicaRepository.save(politica);

      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.OK,
        'Política de configuración actualizada exitosamente',
        PATH,
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
        'AUT-121',
        'Error actualizando política de configuración',
      );
    }
  }

  /**
   * Reordena una política dentro de su módulo. Desplaza a los hermanos
   * (mismo `moduloId`, incluidos los inactivos) en una sola transacción para
   * no duplicar `orden` en el listado.
   */
  // AUT-124
  async reorder(reorderDto: ReorderConfigPoliticaDto) {
    try {
      const { id } = reorderDto;
      let { nuevoOrden } = reorderDto;

      const politica = await this.politicaRepository.findOne({
        where: { id },
      });
      if (!politica) {
        return this.customThrowError(
          '',
          'AUT-124-01',
          `Política de configuración con ID ${id} no encontrada`,
        );
      }

      // Coherente con create(): 0 se trata como primera posición (1).
      if (nuevoOrden === 0) {
        nuevoOrden = 1;
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de abrir
      // la transacción que escribe en la base de datos.
      await this.executor.verificarPuntoDeAutorizacion();

      const actualizado = await this.politicaRepository.manager.transaction(
        async (manager) => {
          const repo = manager.getRepository(ConfigPolitica);
          const politicaLocked = await repo.findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
          });
          if (!politicaLocked) {
            throw {
              statusCode: HttpStatus.BAD_REQUEST,
              success: false,
              message: `Política de configuración con ID ${id} no encontrada`,
            };
          }

          const ordenActual = politicaLocked.orden;
          const moduloId = politicaLocked.moduloId;

          const rawMax = await repo
            .createQueryBuilder('p')
            .select('MAX(p.orden)', 'max')
            .where('p.moduloId = :moduloId', { moduloId })
            .getRawOne<{ max: number | null }>();
          const maxOrden = Number(rawMax?.max) || ordenActual;
          if (nuevoOrden > maxOrden) {
            nuevoOrden = maxOrden;
          }

          if (nuevoOrden === ordenActual) {
            return politicaLocked;
          }

          const shiftQb = repo
            .createQueryBuilder()
            .update(ConfigPolitica)
            .where('id != :id', { id })
            .andWhere('moduloId = :moduloId', { moduloId })
            .andWhere('deleted_at IS NULL');

          if (nuevoOrden < ordenActual) {
            // Sube (ej. 5 → 2): +1 a los que están entre 2 y 4.
            shiftQb
              .set({ orden: () => 'orden + 1' })
              .andWhere('orden >= :nuevoOrden AND orden < :ordenActual', {
                nuevoOrden,
                ordenActual,
              });
          } else {
            // Baja (ej. 2 → 5): -1 a los que están entre 3 y 5.
            shiftQb
              .set({ orden: () => 'orden - 1' })
              .andWhere('orden > :ordenActual AND orden <= :nuevoOrden', {
                nuevoOrden,
                ordenActual,
              });
          }

          await shiftQb.execute();

          politicaLocked.orden = nuevoOrden;
          return repo.save(politicaLocked);
        },
      );

      return this.customSuccessResponse(
        actualizado,
        null,
        HttpStatus.OK,
        'Política de configuración reordenada exitosamente',
        PATH,
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
        'AUT-124',
        'Error al reordenar política de configuración',
      );
    }
  }

  /** Siguiente posición libre al final de las políticas de un módulo. */
  private async obtenerSiguienteOrden(moduloId: string): Promise<number> {
    const rawMax = await this.politicaRepository
      .createQueryBuilder('p')
      .select('MAX(p.orden)', 'max')
      .where('p.moduloId = :moduloId', { moduloId })
      .getRawOne<{ max: number | null }>();

    return (Number(rawMax?.max) || 0) + 1;
  }

  // AUT-122
  async remove(id: string) {
    try {
      const politica = await this.politicaRepository.findOne({ where: { id } });
      if (!politica) {
        return this.customThrowError(
          '',
          'AUT-122-01',
          `Política de configuración con ID ${id} no encontrada`,
        );
      }

      const configsActivos = await this.configRepository.count({
        where: { politicaId: id, activo: true },
      });
      if (configsActivos > 0) {
        return this.customThrowError(
          '',
          'AUT-122-02',
          `No se puede eliminar la política ${politica.codigo}: tiene ${configsActivos} parámetro(s) activo(s) asociado(s). Desactívelos o reasígnelos primero.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, antes de la escritura.
      await this.executor.verificarPuntoDeAutorizacion();

      // El borrado y la compactación de órdenes del módulo se hacen en una
      // sola transacción para que no quede un hueco si algo falla.
      await this.politicaRepository.manager.transaction(async (manager) => {
        const repo = manager.getRepository(ConfigPolitica);
        const politicaLocked = await repo.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!politicaLocked) {
          throw {
            statusCode: HttpStatus.BAD_REQUEST,
            success: false,
            message: `Política de configuración con ID ${id} no encontrada`,
          };
        }

        const ordenEliminado = politicaLocked.orden;
        const moduloId = politicaLocked.moduloId;

        await repo.update({ id }, { activo: false });
        await repo.softDelete({ id });

        // Las políticas posteriores del mismo módulo bajan una posición.
        await repo
          .createQueryBuilder()
          .update(ConfigPolitica)
          .set({ orden: () => 'orden - 1' })
          .where('moduloId = :moduloId', { moduloId })
          .andWhere('orden > :orden', { orden: ordenEliminado })
          .andWhere('deleted_at IS NULL')
          .execute();
      });

      return this.customSuccessResponse(
        politica,
        null,
        HttpStatus.OK,
        'Política de configuración eliminada exitosamente',
        PATH,
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
        'AUT-122',
        'Error eliminando política de configuración',
      );
    }
  }
}
