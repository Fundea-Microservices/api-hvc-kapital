import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Brackets, Not, Repository } from 'typeorm';
import { CatalogoTipo } from 'database/entities/catalogos/catalogo-tipo.entity';
import { CatalogoItem } from 'database/entities/catalogos/catalogo-item.entity';
import { BaseService } from 'src/common';
import {
  CreateCatalogoTipoDto,
  PaginationCatalogoTipoDto,
  UpdateCatalogoTipoDto,
} from './dto';
import { deserializarJson, serializarJson } from '../utils/catalogo.util';
import { AuthorizationExecutorService } from '../../auth/usuarios/authorization-executor.service';

const PATH = 'catalogos/tipos';

@Injectable()
export class CatalogosTiposService extends BaseService {
  protected readonly logger = new Logger('CatalogosTiposService');

  constructor(
    @Inject('CATALOGO_TIPO_REPOSITORY')
    private readonly catalogoTipoRepository: Repository<CatalogoTipo>,

    @Inject('CATALOGO_ITEM_REPOSITORY')
    private readonly catalogoItemRepository: Repository<CatalogoItem>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  /**
   * Crea un tipo de catálogo (PAIS, MONEDA, ...).
   */
  // CAT-01
  async create(createDto: CreateCatalogoTipoDto) {
    try {
      const existente = await this.catalogoTipoRepository.findOne({
        where: { codigo: createDto.codigo },
      });
      if (existente) {
        return this.customThrowError(
          '',
          'CAT-01-01',
          `Ya existe un catálogo con el código ${createDto.codigo}`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { esquemaAtributos, ...rest } = createDto;
      const tipo = this.catalogoTipoRepository.create({
        ...rest,
        esquemaAtributos: serializarJson(esquemaAtributos),
      });
      const saved = await this.catalogoTipoRepository.save(tipo);

      return this.customSuccessResponse(
        this.toResponse(saved),
        null,
        HttpStatus.CREATED,
        'Catálogo creado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'CAT-01', 'Error al crear catálogo');
    }
  }

  /**
   * Lista los catálogos con paginación, búsqueda y filtros de estado.
   */
  // CAT-02
  async findAll(paginationDto: PaginationCatalogoTipoDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        todos,
        activo,
        permiteJerarquia,
      } = paginationDto;

      const qb = this.catalogoTipoRepository.createQueryBuilder('t');

      if (busqueda) {
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where('t.codigo LIKE :busqueda')
              .orWhere('t.nombre LIKE :busqueda')
              .orWhere('t.descripcion LIKE :busqueda');
          }),
          { busqueda: `%${busqueda}%` },
        );
      }

      if (activo !== undefined) {
        qb.andWhere('t.activo = :activo', { activo });
      }

      if (permiteJerarquia !== undefined) {
        qb.andWhere('t.permiteJerarquia = :permiteJerarquia', {
          permiteJerarquia,
        });
      }

      qb.orderBy('t.nombre', 'ASC').addOrderBy('t.codigo', 'ASC');

      if (!todos) {
        qb.skip((page - 1) * limit).take(limit);
      }

      const [data, total] = await qb.getManyAndCount();

      const metadata = todos
        ? { total, page: 1, limit: total }
        : { total, page, limit };

      return this.customSuccessResponse(
        data.map((tipo) => this.toResponse(tipo)),
        metadata,
        HttpStatus.OK,
        'Catálogos listados correctamente',
        PATH,
      );
    } catch (error) {
      this.customThrowError(error, 'CAT-02', 'Error listando catálogos');
    }
  }

  /**
   * Obtiene un catálogo por su UUID.
   */
  // CAT-03
  async findOne(id: string) {
    try {
      const tipo = await this.obtenerTipo(id);

      return this.customSuccessResponse(
        this.toResponse(tipo),
        null,
        HttpStatus.OK,
        'Catálogo encontrado',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'CAT-03', 'Error obteniendo catálogo');
    }
  }

  /**
   * Actualiza un catálogo. El código se puede cambiar: los ítems referencian
   * el catálogo por UUID, no por código.
   */
  // CAT-04
  async update(id: string, updateDto: UpdateCatalogoTipoDto) {
    try {
      const tipo = await this.obtenerTipo(id);

      if (updateDto.codigo && updateDto.codigo !== tipo.codigo) {
        const duplicado = await this.catalogoTipoRepository.findOne({
          where: { codigo: updateDto.codigo, id: Not(id) },
        });
        if (duplicado) {
          return this.customThrowError(
            '',
            'CAT-04-02',
            `Ya existe otro catálogo con el código ${updateDto.codigo}`,
          );
        }
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { esquemaAtributos, ...rest } = updateDto;
      Object.assign(tipo, rest);
      if (esquemaAtributos !== undefined) {
        tipo.esquemaAtributos = serializarJson(esquemaAtributos);
      }

      const updated = await this.catalogoTipoRepository.save(tipo);

      return this.customSuccessResponse(
        this.toResponse(updated),
        null,
        HttpStatus.OK,
        'Catálogo actualizado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'CAT-04', 'Error actualizando catálogo');
    }
  }

  /**
   * Elimina (soft-delete) un catálogo. Se bloquea si conserva ítems vivos para
   * no dejar referencias huérfanas; en ese caso debe desactivarse.
   */
  // CAT-05
  async remove(id: string) {
    try {
      const tipo = await this.obtenerTipo(id);

      const items = await this.catalogoItemRepository.count({
        where: { catalogoTipoId: tipo.id },
      });
      if (items > 0) {
        return this.customThrowError(
          '',
          'CAT-05-02',
          `No se puede eliminar el catálogo ${tipo.codigo}: tiene ${items} ítem(s) asociado(s). Puede desactivarlo.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.catalogoTipoRepository.update({ id }, { activo: false });
      await this.catalogoTipoRepository.softDelete({ id });

      return this.customSuccessResponse(
        this.toResponse(tipo),
        null,
        HttpStatus.OK,
        'Catálogo eliminado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'CAT-05', 'Error eliminando catálogo');
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async obtenerTipo(id: string): Promise<CatalogoTipo> {
    const tipo = await this.catalogoTipoRepository.findOne({ where: { id } });
    if (!tipo) {
      return this.customThrowError(
        '',
        'CAT-03-01',
        `Catálogo con ID ${id} no encontrado`,
      );
    }
    return tipo;
  }

  /** Devuelve el catálogo con `esquemaAtributos` ya parseado. */
  private toResponse(tipo: CatalogoTipo) {
    return {
      ...tipo,
      esquemaAtributos: deserializarJson(tipo.esquemaAtributos),
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
