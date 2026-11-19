import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Brackets, Not, Repository } from 'typeorm';
import { CatalogoItem } from 'database/entities/catalogos/catalogo-item.entity';
import { CatalogoRelacion } from 'database/entities/catalogos/catalogo-relacion.entity';
import { BaseService } from 'src/common';
import {
  CreateCatalogoRelacionDto,
  PaginationCatalogoRelacionDto,
  UpdateCatalogoRelacionDto,
} from './dto';
import { deserializarJson, serializarJson } from '../utils/catalogo.util';
import { AuthorizationExecutorService } from '../../auth/usuarios/authorization-executor.service';

const PATH = 'catalogos/relaciones';

@Injectable()
export class CatalogosRelacionesService extends BaseService {
  protected readonly logger = new Logger('CatalogosRelacionesService');

  constructor(
    @Inject('CATALOGO_RELACION_REPOSITORY')
    private readonly catalogoRelacionRepository: Repository<CatalogoRelacion>,

    @Inject('CATALOGO_ITEM_REPOSITORY')
    private readonly catalogoItemRepository: Repository<CatalogoItem>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  /**
   * Crea una relación N:M entre dos ítems de catálogos. Evita vínculos
   * consigo mismo y combinaciones duplicadas (origen, destino, tipoRelacion).
   */
  // CAT-14
  async create(createDto: CreateCatalogoRelacionDto) {
    try {
      await this.validarExtremos(
        createDto.itemOrigenId,
        createDto.itemDestinoId,
        'CAT-14',
      );

      await this.validarDuplicado(
        createDto.itemOrigenId,
        createDto.itemDestinoId,
        createDto.tipoRelacion,
        'CAT-14',
      );

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { atributos, ...rest } = createDto;
      const relacion = this.catalogoRelacionRepository.create({
        ...rest,
        atributos: serializarJson(atributos),
      });
      const saved = await this.catalogoRelacionRepository.save(relacion);

      return this.customSuccessResponse(
        this.toResponse(saved),
        null,
        HttpStatus.CREATED,
        'Relación de catálogo creada exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'CAT-14',
        'Error al crear relación de catálogo',
      );
    }
  }

  /**
   * Lista relaciones con filtros por origen, destino, tipo y estado.
   */
  // CAT-15
  async findAll(paginationDto: PaginationCatalogoRelacionDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        todos,
        itemOrigenId,
        itemDestinoId,
        tipoRelacion,
        activo,
      } = paginationDto;

      const qb = this.catalogoRelacionRepository.createQueryBuilder('r');

      if (itemOrigenId) {
        qb.andWhere('r.itemOrigenId = :itemOrigenId', { itemOrigenId });
      }

      if (itemDestinoId) {
        qb.andWhere('r.itemDestinoId = :itemDestinoId', { itemDestinoId });
      }

      if (tipoRelacion) {
        qb.andWhere('r.tipoRelacion = :tipoRelacion', { tipoRelacion });
      }

      if (activo !== undefined) {
        qb.andWhere('r.activo = :activo', { activo });
      }

      if (busqueda) {
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where('r.tipoRelacion LIKE :busqueda')
              .orWhere('CAST(r.atributos AS nvarchar(MAX)) LIKE :busqueda');
          }),
          { busqueda: `%${busqueda}%` },
        );
      }

      qb.orderBy('r.created_at', 'DESC').addOrderBy('r.tipoRelacion', 'ASC');

      if (!todos) {
        qb.skip((page - 1) * limit).take(limit);
      }

      const [rows, total] = await qb.getManyAndCount();

      const metadata = todos
        ? { total, page: 1, limit: total }
        : { total, page, limit };

      return this.customSuccessResponse(
        rows.map((relacion) => this.toResponse(relacion)),
        metadata,
        HttpStatus.OK,
        'Relaciones de catálogo listadas correctamente',
        PATH,
      );
    } catch (error) {
      this.customThrowError(
        error,
        'CAT-15',
        'Error listando relaciones de catálogo',
      );
    }
  }

  /**
   * Obtiene una relación por su UUID.
   */
  // CAT-16
  async findOne(id: string) {
    try {
      const relacion = await this.obtenerRelacion(id);

      return this.customSuccessResponse(
        this.toResponse(relacion),
        null,
        HttpStatus.OK,
        'Relación de catálogo encontrada',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'CAT-16',
        'Error obteniendo relación de catálogo',
      );
    }
  }

  /**
   * Actualiza una relación. Si cambian los extremos o el tipo, revalida
   * existencia, vínculo consigo mismo y duplicados.
   */
  // CAT-17
  async update(id: string, updateDto: UpdateCatalogoRelacionDto) {
    try {
      const relacion = await this.obtenerRelacion(id);

      const origenId = updateDto.itemOrigenId ?? relacion.itemOrigenId;
      const destinoId = updateDto.itemDestinoId ?? relacion.itemDestinoId;
      const tipoRelacion = updateDto.tipoRelacion ?? relacion.tipoRelacion;

      await this.validarExtremos(origenId, destinoId, 'CAT-17');

      await this.validarDuplicado(
        origenId,
        destinoId,
        tipoRelacion,
        'CAT-17',
        relacion.id,
      );

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { atributos, ...rest } = updateDto;
      Object.assign(relacion, rest);
      relacion.itemOrigenId = origenId;
      relacion.itemDestinoId = destinoId;
      relacion.tipoRelacion = tipoRelacion;
      if (atributos !== undefined) {
        relacion.atributos = serializarJson(atributos);
      }

      const updated = await this.catalogoRelacionRepository.save(relacion);

      return this.customSuccessResponse(
        this.toResponse(updated),
        null,
        HttpStatus.OK,
        'Relación de catálogo actualizada exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'CAT-17',
        'Error actualizando relación de catálogo',
      );
    }
  }

  /**
   * Elimina (soft-delete) una relación.
   */
  // CAT-18
  async remove(id: string) {
    try {
      const relacion = await this.obtenerRelacion(id);

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.catalogoRelacionRepository.update({ id }, { activo: false });
      await this.catalogoRelacionRepository.softDelete({ id });

      return this.customSuccessResponse(
        this.toResponse(relacion),
        null,
        HttpStatus.OK,
        'Relación de catálogo eliminada exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'CAT-18',
        'Error eliminando relación de catálogo',
      );
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async obtenerRelacion(id: string): Promise<CatalogoRelacion> {
    const relacion = await this.catalogoRelacionRepository.findOne({
      where: { id },
    });
    if (!relacion) {
      return this.customThrowError(
        '',
        'CAT-16-01',
        `Relación de catálogo con ID ${id} no encontrada`,
      );
    }
    return relacion;
  }

  private async validarExtremos(
    itemOrigenId: string,
    itemDestinoId: string,
    codigoBase: string,
  ): Promise<void> {
    if (itemOrigenId === itemDestinoId) {
      return this.customThrowError(
        '',
        `${codigoBase}-01`,
        'El ítem origen y el ítem destino deben ser distintos',
      );
    }

    const origen = await this.catalogoItemRepository.findOne({
      where: { id: itemOrigenId },
    });
    if (!origen) {
      return this.customThrowError(
        '',
        `${codigoBase}-02`,
        `Ítem origen con ID ${itemOrigenId} no encontrado`,
      );
    }

    const destino = await this.catalogoItemRepository.findOne({
      where: { id: itemDestinoId },
    });
    if (!destino) {
      return this.customThrowError(
        '',
        `${codigoBase}-03`,
        `Ítem destino con ID ${itemDestinoId} no encontrado`,
      );
    }
  }

  private async validarDuplicado(
    itemOrigenId: string,
    itemDestinoId: string,
    tipoRelacion: string,
    codigoBase: string,
    idExcluir?: string,
  ): Promise<void> {
    const existente = await this.catalogoRelacionRepository.findOne({
      where: {
        itemOrigenId,
        itemDestinoId,
        tipoRelacion,
        ...(idExcluir ? { id: Not(idExcluir) } : {}),
      },
    });

    if (existente) {
      return this.customThrowError(
        '',
        `${codigoBase}-04`,
        `Ya existe una relación ${tipoRelacion} entre el ítem origen ${itemOrigenId} y el ítem destino ${itemDestinoId}`,
      );
    }
  }

  private toResponse(relacion: CatalogoRelacion) {
    return {
      ...relacion,
      atributos: deserializarJson(relacion.atributos),
    };
  }

  private esErrorDeNegocio(error: unknown): boolean {
    return (
      error instanceof HttpException ||
      (!!error &&
        typeof error === 'object' &&
        !!(error as { statusCode?: number }).statusCode &&
        (error as { success?: boolean }).success === false)
    );
  }
}
