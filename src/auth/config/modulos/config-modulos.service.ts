import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Brackets, Not, Repository } from 'typeorm';
import { ConfigModulo } from 'database/entities/config-modulo.entity';
import { ConfigPolitica } from 'database/entities/config-politica.entity';
import { BaseService } from 'src/common';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import {
  CreateConfigModuloDto,
  ReorderConfigModuloDto,
  UpdateConfigModuloDto,
} from '../dto';
import { AuthorizationExecutorService } from '../../usuarios/authorization-executor.service';

const PATH = 'config/modulos';

@Injectable()
export class ConfigModulosService extends BaseService {
  constructor(
    @Inject('CONFIG_MODULO_REPOSITORY')
    private readonly moduloRepository: Repository<ConfigModulo>,

    @Inject('CONFIG_POLITICA_REPOSITORY')
    private readonly politicaRepository: Repository<ConfigPolitica>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  protected readonly logger = new Logger('ConfigModulosService');
  onModuleInit() {
    this.logger.log('ConfigModulosService initialized');
  }

  // AUT-112
  async create(createDto: CreateConfigModuloDto) {
    try {
      const existente = await this.moduloRepository.findOne({
        where: { codigo: createDto.codigo },
      });
      if (existente) {
        return this.customThrowError(
          '',
          'AUT-112-01',
          `Ya existe un módulo de configuración con el código ${createDto.codigo}`,
        );
      }

      // Si el cliente no envía orden, se ubica al final para no repetir el 0
      // por defecto de la columna. Un orden explícito debe estar libre.
      const orden = createDto.orden ?? (await this.obtenerSiguienteOrden());
      const ordenOcupado = await this.moduloRepository.findOne({
        where: { orden },
      });
      if (ordenOcupado) {
        return this.customThrowError(
          '',
          'AUT-112-02',
          `El orden ${orden} ya está ocupado por el módulo ${ordenOcupado.codigo}. Seleccione un orden disponible.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const modulo = this.moduloRepository.create({
        ...createDto,
        orden,
        activo: createDto.activo ?? true,
      });
      const saved = await this.moduloRepository.save(modulo);

      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Módulo de configuración creado exitosamente',
        PATH,
      );
    } catch (error) {
      // El 428 del punto de autorización debe llegar intacto al filtro global.
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
        'AUT-112',
        'Error al crear módulo de configuración',
      );
    }
  }

  // AUT-113
  async findAll(paginationDto: PaginationActiveDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        activo,
        todos,
      } = paginationDto;

      const qb = this.moduloRepository.createQueryBuilder('m');

      if (busqueda) {
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where('m.codigo LIKE :busqueda')
              .orWhere('m.nombre LIKE :busqueda')
              .orWhere('m.descripcion LIKE :busqueda');
          }),
          { busqueda: `%${busqueda}%` },
        );
      }

      if (activo !== undefined) {
        qb.andWhere('m.activo = :activo', { activo });
      }

      qb.orderBy('m.orden', 'ASC').addOrderBy('m.nombre', 'ASC');

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
        'Módulos de configuración listados correctamente',
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
        'AUT-113',
        'Error listando módulos de configuración',
      );
    }
  }

  // AUT-114
  async findOne(id: string) {
    try {
      const modulo = await this.moduloRepository
        .createQueryBuilder('m')
        // Solo se incluyen las políticas vigentes: las inactivas se consultan
        // aparte con GET /config/politicas?moduloId=...
        .leftJoinAndSelect(
          'm.politicas',
          'politica',
          'politica.activo = :activo AND politica.deleted_at IS NULL',
          { activo: true },
        )
        .where('m.id = :id', { id })
        .orderBy('politica.orden', 'ASC')
        .addOrderBy('politica.nombre', 'ASC')
        .getOne();

      if (!modulo) {
        return this.customThrowError(
          '',
          'AUT-114-01',
          `Módulo de configuración con ID ${id} no encontrado`,
        );
      }

      return this.customSuccessResponse(
        modulo,
        null,
        HttpStatus.OK,
        'Módulo de configuración encontrado',
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
        'AUT-114',
        'Error obteniendo módulo de configuración',
      );
    }
  }

  // AUT-115
  async update(id: string, updateDto: UpdateConfigModuloDto) {
    try {
      const modulo = await this.moduloRepository.findOne({ where: { id } });
      if (!modulo) {
        return this.customThrowError(
          '',
          'AUT-115-01',
          `Módulo de configuración con ID ${id} no encontrado`,
        );
      }

      if (updateDto.codigo && updateDto.codigo !== modulo.codigo) {
        const duplicado = await this.moduloRepository.findOne({
          where: { codigo: updateDto.codigo, id: Not(id) },
        });
        if (duplicado) {
          return this.customThrowError(
            '',
            'AUT-115-02',
            `Ya existe otro módulo de configuración con el código ${updateDto.codigo}`,
          );
        }
      }

      // PUNTO DE CONTROL: validaciones completadas, antes de la escritura.
      await this.executor.verificarPuntoDeAutorizacion();

      Object.assign(modulo, updateDto);
      const saved = await this.moduloRepository.save(modulo);

      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.OK,
        'Módulo de configuración actualizado exitosamente',
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
        'AUT-115',
        'Error actualizando módulo de configuración',
      );
    }
  }

  /**
   * Reordena un módulo dentro del listado global. Desplaza a los hermanos
   * (todos los módulos vivos) en una sola transacción para no duplicar `orden`.
   */
  // AUT-123
  async reorder(reorderDto: ReorderConfigModuloDto) {
    try {
      const { id } = reorderDto;
      let { nuevoOrden } = reorderDto;

      const modulo = await this.moduloRepository.findOne({ where: { id } });
      if (!modulo) {
        return this.customThrowError(
          '',
          'AUT-123-01',
          `Módulo de configuración con ID ${id} no encontrado`,
        );
      }

      // Coherente con create(): 0 se trata como primera posición (1).
      if (nuevoOrden === 0) {
        nuevoOrden = 1;
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de abrir
      // la transacción que escribe en la base de datos.
      await this.executor.verificarPuntoDeAutorizacion();

      const actualizado = await this.moduloRepository.manager.transaction(
        async (manager) => {
          const repo = manager.getRepository(ConfigModulo);
          const moduloLocked = await repo.findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
          });
          if (!moduloLocked) {
            throw {
              statusCode: HttpStatus.BAD_REQUEST,
              success: false,
              message: `Módulo de configuración con ID ${id} no encontrado`,
            };
          }

          const ordenActual = moduloLocked.orden;

          const rawMax = await repo
            .createQueryBuilder('m')
            .select('MAX(m.orden)', 'max')
            .getRawOne<{ max: number | null }>();
          const maxOrden = Number(rawMax?.max) || ordenActual;
          if (nuevoOrden > maxOrden) {
            nuevoOrden = maxOrden;
          }

          if (nuevoOrden === ordenActual) {
            return moduloLocked;
          }

          const shiftQb = repo
            .createQueryBuilder()
            .update(ConfigModulo)
            .where('id != :id', { id })
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

          moduloLocked.orden = nuevoOrden;
          return repo.save(moduloLocked);
        },
      );

      return this.customSuccessResponse(
        actualizado,
        null,
        HttpStatus.OK,
        'Módulo de configuración reordenado exitosamente',
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
        'AUT-123',
        'Error al reordenar módulo de configuración',
      );
    }
  }

  /** Siguiente posición libre al final del listado global de módulos. */
  private async obtenerSiguienteOrden(): Promise<number> {
    const rawMax = await this.moduloRepository
      .createQueryBuilder('m')
      .select('MAX(m.orden)', 'max')
      .getRawOne<{ max: number | null }>();

    return (Number(rawMax?.max) || 0) + 1;
  }

  // AUT-116
  async remove(id: string) {
    try {
      const modulo = await this.moduloRepository.findOne({ where: { id } });
      if (!modulo) {
        return this.customThrowError(
          '',
          'AUT-116-01',
          `Módulo de configuración con ID ${id} no encontrado`,
        );
      }

      const politicasActivas = await this.politicaRepository.count({
        where: { moduloId: id, activo: true },
      });
      if (politicasActivas > 0) {
        return this.customThrowError(
          '',
          'AUT-116-02',
          `No se puede eliminar el módulo ${modulo.codigo}: tiene ${politicasActivas} política(s) activa(s) asociada(s). Desactívelas o reasígnelas primero.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, antes de la escritura.
      await this.executor.verificarPuntoDeAutorizacion();

      // Se conserva la foto previa en la respuesta (igual que el resto del
      // proyecto). El borrado y la compactación de órdenes se hacen en una
      // sola transacción para que no quede un hueco si algo falla.
      await this.moduloRepository.manager.transaction(async (manager) => {
        const repo = manager.getRepository(ConfigModulo);
        const moduloLocked = await repo.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!moduloLocked) {
          throw {
            statusCode: HttpStatus.BAD_REQUEST,
            success: false,
            message: `Módulo de configuración con ID ${id} no encontrado`,
          };
        }

        const ordenEliminado = moduloLocked.orden;

        await repo.update({ id }, { activo: false });
        await repo.softDelete({ id });

        // Los módulos posteriores bajan una posición para llenar el hueco.
        await repo
          .createQueryBuilder()
          .update(ConfigModulo)
          .set({ orden: () => 'orden - 1' })
          .where('orden > :orden', { orden: ordenEliminado })
          .andWhere('deleted_at IS NULL')
          .execute();
      });

      return this.customSuccessResponse(
        modulo,
        null,
        HttpStatus.OK,
        'Módulo de configuración eliminado exitosamente',
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
        'AUT-116',
        'Error eliminando módulo de configuración',
      );
    }
  }
}
