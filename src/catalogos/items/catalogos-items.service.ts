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
import { CatalogoRelacion } from 'database/entities/catalogos/catalogo-relacion.entity';
import { BaseService } from 'src/common';
import {
  CreateCatalogoItemDto,
  PaginationCatalogoItemDto,
  UpdateCatalogoItemDto,
} from './dto';
import { deserializarJson, serializarJson } from '../utils/catalogo.util';
import { AuthorizationExecutorService } from '../../auth/usuarios/authorization-executor.service';

const PATH = 'catalogos/items';

type NodoCatalogo = {
  id: string;
  catalogoTipoId: string;
  padreId: string | null;
  codigo: string;
  nombre: string;
  valor: string;
  orden: number;
  activo: boolean;
  atributos: unknown;
  hijos: NodoCatalogo[];
};

@Injectable()
export class CatalogosItemsService extends BaseService {
  protected readonly logger = new Logger('CatalogosItemsService');

  constructor(
    @Inject('CATALOGO_ITEM_REPOSITORY')
    private readonly catalogoItemRepository: Repository<CatalogoItem>,

    @Inject('CATALOGO_TIPO_REPOSITORY')
    private readonly catalogoTipoRepository: Repository<CatalogoTipo>,

    @Inject('CATALOGO_RELACION_REPOSITORY')
    private readonly catalogoRelacionRepository: Repository<CatalogoRelacion>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  /**
   * Crea un ítem dentro de un catálogo. Valida jerarquía habilitada, que el
   * padre pertenezca al mismo catálogo y que el código no se repita.
   */
  // CAT-07
  async create(createDto: CreateCatalogoItemDto) {
    try {
      const tipo = await this.catalogoTipoRepository.findOne({
        where: { id: createDto.catalogoTipoId },
      });
      if (!tipo) {
        return this.customThrowError(
          '',
          'CAT-07-01',
          `Catálogo con ID ${createDto.catalogoTipoId} no encontrado`,
        );
      }
      if (!tipo.activo) {
        return this.customThrowError(
          '',
          'CAT-07-02',
          `El catálogo ${tipo.codigo} está inactivo y no admite nuevos ítems`,
        );
      }

      if (createDto.padreId) {
        await this.validarPadre(tipo, createDto.padreId, 'CAT-07');
      }

      const duplicado = await this.catalogoItemRepository.findOne({
        where: { catalogoTipoId: tipo.id, codigo: createDto.codigo },
      });
      if (duplicado) {
        return this.customThrowError(
          '',
          'CAT-07-07',
          `Ya existe un ítem con el código ${createDto.codigo} en el catálogo ${tipo.codigo}`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { padreId, atributos, ...rest } = createDto;
      const item = this.catalogoItemRepository.create({
        ...rest,
        catalogoTipoId: tipo.id,
        padreId: padreId ?? null,
        atributos: serializarJson(atributos),
      });
      const saved = await this.catalogoItemRepository.save(item);

      return this.customSuccessResponse(
        this.toResponse(saved),
        null,
        HttpStatus.CREATED,
        'Ítem de catálogo creado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'CAT-07', 'Error al crear ítem de catálogo');
    }
  }

  /**
   * Lista ítems con filtros por catálogo, padre, estado y búsqueda.
   */
  // CAT-08
  async findAll(paginationDto: PaginationCatalogoItemDto) {
    try {
      const { data, metadata } = await this.listar(paginationDto);

      return this.customSuccessResponse(
        data,
        metadata,
        HttpStatus.OK,
        'Ítems de catálogo listados correctamente',
        PATH,
      );
    } catch (error) {
      this.customThrowError(error, 'CAT-08', 'Error listando ítems de catálogo');
    }
  }

  /**
   * Lista los ítems de un catálogo identificado por su código (ej. PAIS).
   */
  // CAT-09
  async findByTipoCodigo(
    codigo: string,
    paginationDto: PaginationCatalogoItemDto,
  ) {
    try {
      const tipo = await this.catalogoTipoRepository.findOne({
        where: { codigo: codigo.toUpperCase() },
      });
      if (!tipo) {
        return this.customThrowError(
          '',
          'CAT-09-01',
          `Catálogo con código ${codigo.toUpperCase()} no encontrado`,
        );
      }

      const { data, metadata } = await this.listar({
        ...paginationDto,
        catalogoTipoId: tipo.id,
      });

      return this.customSuccessResponse(
        data,
        metadata,
        HttpStatus.OK,
        `Ítems del catálogo ${tipo.codigo} listados correctamente`,
        `${PATH}/por-tipo/${tipo.codigo}`,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'CAT-09',
        'Error listando ítems por código de catálogo',
      );
    }
  }

  /**
   * Obtiene un ítem por su UUID.
   */
  // CAT-10
  async findOne(id: string) {
    try {
      const item = await this.obtenerItem(id);

      return this.customSuccessResponse(
        this.toResponse(item),
        null,
        HttpStatus.OK,
        'Ítem de catálogo encontrado',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'CAT-10', 'Error obteniendo ítem de catálogo');
    }
  }

  /**
   * Devuelve el árbol jerárquico del ítem solicitado (él mismo como raíz y
   * todos sus descendientes por `padreId`).
   */
  // CAT-11
  async findArbol(id: string) {
    try {
      const raiz = await this.obtenerItem(id);

      const items = await this.catalogoItemRepository.find({
        where: { catalogoTipoId: raiz.catalogoTipoId },
        order: { orden: 'ASC', nombre: 'ASC' },
      });

      const hijosPorPadre = new Map<string, CatalogoItem[]>();
      for (const item of items) {
        if (!item.padreId) continue;
        const lista = hijosPorPadre.get(item.padreId) ?? [];
        lista.push(item);
        hijosPorPadre.set(item.padreId, lista);
      }

      const arbol = this.construirNodo(raiz, hijosPorPadre, new Set<string>());

      return this.customSuccessResponse(
        arbol,
        null,
        HttpStatus.OK,
        'Árbol de catálogo obtenido correctamente',
        `${PATH}/${id}/arbol`,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'CAT-11',
        'Error obteniendo árbol de catálogo',
      );
    }
  }

  /**
   * Actualiza un ítem. Si cambia de catálogo o de padre, revalida jerarquía,
   * pertenencia y ciclos.
   */
  // CAT-12
  async update(id: string, updateDto: UpdateCatalogoItemDto) {
    try {
      const item = await this.obtenerItem(id);

      const tipoIdFinal = updateDto.catalogoTipoId ?? item.catalogoTipoId;
      const tipo = await this.catalogoTipoRepository.findOne({
        where: { id: tipoIdFinal },
      });
      if (!tipo) {
        return this.customThrowError(
          '',
          'CAT-12-01',
          `Catálogo con ID ${tipoIdFinal} no encontrado`,
        );
      }
      if (!tipo.activo) {
        return this.customThrowError(
          '',
          'CAT-12-02',
          `El catálogo ${tipo.codigo} está inactivo y no admite cambios en sus ítems`,
        );
      }

      const cambiaTipo = tipo.id !== item.catalogoTipoId;
      if (cambiaTipo) {
        const hijos = await this.catalogoItemRepository.count({
          where: { padreId: item.id },
        });
        if (hijos > 0) {
          return this.customThrowError(
            '',
            'CAT-12-03',
            `No se puede cambiar de catálogo el ítem ${item.codigo}: tiene ${hijos} hijo(s) en la jerarquía`,
          );
        }
      }

      const codigoFinal = updateDto.codigo ?? item.codigo;
      if (codigoFinal !== item.codigo || cambiaTipo) {
        const duplicado = await this.catalogoItemRepository.findOne({
          where: {
            catalogoTipoId: tipo.id,
            codigo: codigoFinal,
            id: Not(item.id),
          },
        });
        if (duplicado) {
          return this.customThrowError(
            '',
            'CAT-12-04',
            `Ya existe un ítem con el código ${codigoFinal} en el catálogo ${tipo.codigo}`,
          );
        }
      }

      const padreFinal =
        updateDto.padreId !== undefined ? updateDto.padreId : item.padreId;
      if (padreFinal) {
        await this.validarPadre(tipo, padreFinal, 'CAT-12', item.id);
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { padreId, catalogoTipoId, atributos, ...rest } = updateDto;
      Object.assign(item, rest);
      item.catalogoTipoId = tipo.id;
      item.padreId = padreFinal ?? null;
      if (atributos !== undefined) {
        item.atributos = serializarJson(atributos);
      }

      const updated = await this.catalogoItemRepository.save(item);

      return this.customSuccessResponse(
        this.toResponse(updated),
        null,
        HttpStatus.OK,
        'Ítem de catálogo actualizado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'CAT-12',
        'Error actualizando ítem de catálogo',
      );
    }
  }

  /**
   * Elimina (soft-delete) un ítem. Se bloquea si tiene hijos o relaciones
   * vigentes, para no dejar la jerarquía o los cruces apuntando a un nodo
   * eliminado; en ese caso debe desactivarse.
   */
  // CAT-13
  async remove(id: string) {
    try {
      const item = await this.obtenerItem(id);

      const hijos = await this.catalogoItemRepository.count({
        where: { padreId: item.id },
      });
      if (hijos > 0) {
        return this.customThrowError(
          '',
          'CAT-13-02',
          `No se puede eliminar el ítem ${item.codigo}: tiene ${hijos} hijo(s) en la jerarquía. Puede desactivarlo.`,
        );
      }

      const relaciones = await this.catalogoRelacionRepository.count({
        where: [{ itemOrigenId: item.id }, { itemDestinoId: item.id }],
      });
      if (relaciones > 0) {
        return this.customThrowError(
          '',
          'CAT-13-03',
          `No se puede eliminar el ítem ${item.codigo}: tiene ${relaciones} relación(es) vigente(s). Puede desactivarlo.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.catalogoItemRepository.update({ id }, { activo: false });
      await this.catalogoItemRepository.softDelete({ id });

      return this.customSuccessResponse(
        this.toResponse(item),
        null,
        HttpStatus.OK,
        'Ítem de catálogo eliminado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'CAT-13', 'Error eliminando ítem de catálogo');
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async listar(paginationDto: PaginationCatalogoItemDto) {
    const {
      page = 1,
      limit = 10,
      busqueda = '',
      todos,
      catalogoTipoId,
      padreId,
      activo,
    } = paginationDto;

    const qb = this.catalogoItemRepository.createQueryBuilder('i');

    if (catalogoTipoId) {
      qb.andWhere('i.catalogoTipoId = :catalogoTipoId', { catalogoTipoId });
    }

    if (padreId) {
      qb.andWhere('i.padreId = :padreId', { padreId });
    }

    if (activo !== undefined) {
      qb.andWhere('i.activo = :activo', { activo });
    }

    if (busqueda) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('i.codigo LIKE :busqueda')
            .orWhere('i.nombre LIKE :busqueda')
            .orWhere('i.valor LIKE :busqueda');
        }),
        { busqueda: `%${busqueda}%` },
      );
    }

    qb.orderBy('i.orden', 'ASC').addOrderBy('i.nombre', 'ASC');

    if (!todos) {
      qb.skip((page - 1) * limit).take(limit);
    }

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((item) => this.toResponse(item)),
      metadata: todos
        ? { total, page: 1, limit: total }
        : { total, page, limit },
    };
  }

  private async obtenerItem(id: string): Promise<CatalogoItem> {
    const item = await this.catalogoItemRepository.findOne({ where: { id } });
    if (!item) {
      return this.customThrowError(
        '',
        'CAT-10-01',
        `Ítem de catálogo con ID ${id} no encontrado`,
      );
    }
    return item;
  }

  /**
   * Valida que el catálogo permita jerarquía, que el padre exista, pertenezca
   * al mismo catálogo y no genere un ciclo con el ítem que se actualiza.
   */
  private async validarPadre(
    tipo: CatalogoTipo,
    padreId: string,
    codigoBase: string,
    itemId?: string,
  ): Promise<CatalogoItem> {
    if (!tipo.permiteJerarquia) {
      return this.customThrowError(
        '',
        `${codigoBase}-03`,
        `El catálogo ${tipo.codigo} no permite jerarquía (permiteJerarquia = false)`,
      );
    }

    if (itemId && padreId === itemId) {
      return this.customThrowError(
        '',
        `${codigoBase}-04`,
        'Un ítem no puede ser su propio padre',
      );
    }

    const padre = await this.catalogoItemRepository.findOne({
      where: { id: padreId },
    });
    if (!padre) {
      return this.customThrowError(
        '',
        `${codigoBase}-05`,
        `Ítem padre con ID ${padreId} no encontrado`,
      );
    }

    if (padre.catalogoTipoId !== tipo.id) {
      return this.customThrowError(
        '',
        `${codigoBase}-06`,
        `El ítem padre pertenece a otro catálogo; debe ser del catálogo ${tipo.codigo}`,
      );
    }

    if (itemId) {
      await this.validarCiclo(itemId, padre, codigoBase);
    }

    return padre;
  }

  /** Recorre la cadena de ancestros para garantizar que no vuelva al ítem. */
  private async validarCiclo(
    itemId: string,
    padre: CatalogoItem,
    codigoBase: string,
  ): Promise<void> {
    const visitados = new Set<string>();
    let actual: CatalogoItem | null = padre;

    while (actual) {
      if (actual.id === itemId) {
        return this.customThrowError(
          '',
          `${codigoBase}-07`,
          'La jerarquía generaría un ciclo: el padre seleccionado desciende del ítem que se actualiza',
        );
      }
      if (visitados.has(actual.id)) {
        return this.customThrowError(
          '',
          `${codigoBase}-08`,
          'La jerarquía actual contiene un ciclo; corrija los padres antes de continuar',
        );
      }
      visitados.add(actual.id);

      actual = actual.padreId
        ? await this.catalogoItemRepository.findOne({
            where: { id: actual.padreId },
          })
        : null;
    }
  }

  private construirNodo(
    item: CatalogoItem,
    hijosPorPadre: Map<string, CatalogoItem[]>,
    visitados: Set<string>,
  ): NodoCatalogo {
    visitados.add(item.id);

    const hijos = (hijosPorPadre.get(item.id) ?? [])
      .filter((hijo) => !visitados.has(hijo.id))
      .map((hijo) => this.construirNodo(hijo, hijosPorPadre, visitados));

    visitados.delete(item.id);

    return {
      id: item.id,
      catalogoTipoId: item.catalogoTipoId,
      padreId: item.padreId ?? null,
      codigo: item.codigo,
      nombre: item.nombre,
      valor: item.valor,
      orden: item.orden,
      activo: item.activo,
      atributos: deserializarJson(item.atributos),
      hijos,
    };
  }

  private toResponse(item: CatalogoItem) {
    return {
      ...item,
      padreId: item.padreId ?? null,
      atributos: deserializarJson(item.atributos),
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
