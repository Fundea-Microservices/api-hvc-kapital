import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Brackets, Not, Repository } from 'typeorm';
import { Dominio } from 'database/entities/dominios/dominio.entity';
import { DominioValor } from 'database/entities/dominios/dominio-valor.entity';
import { DominioRelacion } from 'database/entities/dominios/dominio-relacion.entity';
import { BaseService } from 'src/common';
import {
  CreateDominioValorDto,
  PaginationDominioValorDto,
  UpdateDominioValorDto,
} from './dto';
import { deserializarJson, serializarJson } from '../utils/dominio.util';
import { AuthorizationExecutorService } from '../../auth/usuarios/authorization-executor.service';

const PATH = 'dominios/valores';

type NodoDominio = {
  id: string;
  dominioId: string;
  padreId: string | null;
  codigo: string;
  nombre: string;
  valor: string;
  ordenMenu: number;
  activo: boolean;
  atributos: unknown;
  hijos: NodoDominio[];
};

@Injectable()
export class DominioValoresService extends BaseService {
  protected readonly logger = new Logger('DominioValoresService');

  constructor(
    @Inject('DOMINIO_VALOR_REPOSITORY')
    private readonly dominioValorRepository: Repository<DominioValor>,

    @Inject('DOMINIO_REPOSITORY')
    private readonly dominioRepository: Repository<Dominio>,

    @Inject('DOMINIO_RELACION_REPOSITORY')
    private readonly dominioRelacionRepository: Repository<DominioRelacion>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  /**
   * Crea un valor dentro de un dominio. Valida jerarquía habilitada, que el
   * padre pertenezca al mismo dominio y que el código no se repita.
   */
  // DOM-07
  async create(createDto: CreateDominioValorDto) {
    try {
      const dominio = await this.dominioRepository.findOne({
        where: { id: createDto.dominioId },
      });
      if (!dominio) {
        return this.customThrowError(
          '',
          'DOM-07-01',
          `Dominio con ID ${createDto.dominioId} no encontrado`,
        );
      }
      if (!dominio.activo) {
        return this.customThrowError(
          '',
          'DOM-07-02',
          `El dominio ${dominio.codigo} está inactivo y no admite nuevos valores`,
        );
      }

      if (createDto.padreId) {
        await this.validarPadre(dominio, createDto.padreId, 'DOM-07');
      }

      const duplicado = await this.dominioValorRepository.findOne({
        where: { dominioId: dominio.id, codigo: createDto.codigo },
      });
      if (duplicado) {
        return this.customThrowError(
          '',
          'DOM-07-07',
          `Ya existe un valor con el código ${createDto.codigo} en el dominio ${dominio.codigo}`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { padreId, atributos, ...rest } = createDto;
      const valorDominio = this.dominioValorRepository.create({
        ...rest,
        dominioId: dominio.id,
        padreId: padreId ?? null,
        atributos: serializarJson(atributos),
      });
      const saved = await this.dominioValorRepository.save(valorDominio);

      return this.customSuccessResponse(
        this.toResponse(saved),
        null,
        HttpStatus.CREATED,
        'Valor de dominio creado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'DOM-07', 'Error al crear valor de dominio');
    }
  }

  /**
   * Lista valores con filtros por dominio, padre, estado y búsqueda.
   */
  // DOM-08
  async findAll(paginationDto: PaginationDominioValorDto) {
    try {
      const { data, metadata } = await this.listar(paginationDto);

      return this.customSuccessResponse(
        data,
        metadata,
        HttpStatus.OK,
        'Valores de dominio listados correctamente',
        PATH,
      );
    } catch (error) {
      this.customThrowError(error, 'DOM-08', 'Error listando valores de dominio');
    }
  }

  /**
   * Lista los valores de un dominio identificado por su código (ej. PAIS),
   * pensado para los selectores del frontend.
   */
  // DOM-09
  async findByDominioCodigo(
    codigo: string,
    paginationDto: PaginationDominioValorDto,
  ) {
    try {
      const dominio = await this.dominioRepository.findOne({
        where: { codigo: codigo.toUpperCase() },
      });
      if (!dominio) {
        return this.customThrowError(
          '',
          'DOM-09-01',
          `Dominio con código ${codigo.toUpperCase()} no encontrado`,
        );
      }

      const { data, metadata } = await this.listar({
        ...paginationDto,
        dominioId: dominio.id,
        activo: paginationDto.activo ?? true,
      });

      return this.customSuccessResponse(
        data,
        metadata,
        HttpStatus.OK,
        `Valores del dominio ${dominio.codigo} listados correctamente`,
        `dominios/${dominio.codigo}/valores`,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'DOM-09',
        'Error listando valores por código de dominio',
      );
    }
  }

  /**
   * Obtiene un valor por su UUID.
   */
  // DOM-10
  async findOne(id: string) {
    try {
      const valor = await this.obtenerValor(id);

      return this.customSuccessResponse(
        this.toResponse(valor),
        null,
        HttpStatus.OK,
        'Valor de dominio encontrado',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'DOM-10', 'Error obteniendo valor de dominio');
    }
  }

  /**
   * Devuelve el árbol jerárquico del valor solicitado (él mismo como raíz y
   * todos sus descendientes por `padreId`).
   */
  // DOM-11
  async findArbol(id: string) {
    try {
      const raiz = await this.obtenerValor(id);

      const valores = await this.dominioValorRepository.find({
        where: { dominioId: raiz.dominioId },
        order: { ordenMenu: 'ASC', nombre: 'ASC' },
      });

      const hijosPorPadre = new Map<string, DominioValor[]>();
      for (const valor of valores) {
        if (!valor.padreId) continue;
        const lista = hijosPorPadre.get(valor.padreId) ?? [];
        lista.push(valor);
        hijosPorPadre.set(valor.padreId, lista);
      }

      const arbol = this.construirNodo(raiz, hijosPorPadre, new Set<string>());

      return this.customSuccessResponse(
        arbol,
        null,
        HttpStatus.OK,
        'Árbol de dominio obtenido correctamente',
        `${PATH}/${id}/arbol`,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'DOM-11',
        'Error obteniendo árbol de dominio',
      );
    }
  }

  /**
   * Actualiza un valor. Si cambia de dominio o de padre, revalida jerarquía,
   * pertenencia y ciclos.
   */
  // DOM-12
  async update(id: string, updateDto: UpdateDominioValorDto) {
    try {
      const valor = await this.obtenerValor(id);

      const dominioIdFinal = updateDto.dominioId ?? valor.dominioId;
      const dominio = await this.dominioRepository.findOne({
        where: { id: dominioIdFinal },
      });
      if (!dominio) {
        return this.customThrowError(
          '',
          'DOM-12-01',
          `Dominio con ID ${dominioIdFinal} no encontrado`,
        );
      }
      if (!dominio.activo) {
        return this.customThrowError(
          '',
          'DOM-12-02',
          `El dominio ${dominio.codigo} está inactivo y no admite cambios en sus valores`,
        );
      }

      const cambiaDominio = dominio.id !== valor.dominioId;
      if (cambiaDominio) {
        const hijos = await this.dominioValorRepository.count({
          where: { padreId: valor.id },
        });
        if (hijos > 0) {
          return this.customThrowError(
            '',
            'DOM-12-03',
            `No se puede cambiar de dominio el valor ${valor.codigo}: tiene ${hijos} hijo(s) en la jerarquía`,
          );
        }
      }

      const codigoFinal = updateDto.codigo ?? valor.codigo;
      if (codigoFinal !== valor.codigo || cambiaDominio) {
        const duplicado = await this.dominioValorRepository.findOne({
          where: {
            dominioId: dominio.id,
            codigo: codigoFinal,
            id: Not(valor.id),
          },
        });
        if (duplicado) {
          return this.customThrowError(
            '',
            'DOM-12-04',
            `Ya existe un valor con el código ${codigoFinal} en el dominio ${dominio.codigo}`,
          );
        }
      }

      const padreFinal =
        updateDto.padreId !== undefined ? updateDto.padreId : valor.padreId;
      if (padreFinal) {
        await this.validarPadre(dominio, padreFinal, 'DOM-12', valor.id);
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { padreId, dominioId, atributos, ...rest } = updateDto;
      Object.assign(valor, rest);
      valor.dominioId = dominio.id;
      valor.padreId = padreFinal ?? null;
      if (atributos !== undefined) {
        valor.atributos = serializarJson(atributos);
      }

      const updated = await this.dominioValorRepository.save(valor);

      return this.customSuccessResponse(
        this.toResponse(updated),
        null,
        HttpStatus.OK,
        'Valor de dominio actualizado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'DOM-12',
        'Error actualizando valor de dominio',
      );
    }
  }

  /**
   * Elimina (soft-delete) un valor. Se bloquea si tiene hijos o relaciones
   * vigentes, para no dejar la jerarquía o los cruces apuntando a un nodo
   * eliminado; en ese caso debe desactivarse.
   */
  // DOM-13
  async remove(id: string) {
    try {
      const valor = await this.obtenerValor(id);

      const hijos = await this.dominioValorRepository.count({
        where: { padreId: valor.id },
      });
      if (hijos > 0) {
        return this.customThrowError(
          '',
          'DOM-13-02',
          `No se puede eliminar el valor ${valor.codigo}: tiene ${hijos} hijo(s) en la jerarquía. Puede desactivarlo.`,
        );
      }

      const relaciones = await this.dominioRelacionRepository.count({
        where: [
          { valorOrigenId: valor.id },
          { valorDestinoId: valor.id },
        ],
      });
      if (relaciones > 0) {
        return this.customThrowError(
          '',
          'DOM-13-03',
          `No se puede eliminar el valor ${valor.codigo}: tiene ${relaciones} relación(es) vigente(s). Puede desactivarlo.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.dominioValorRepository.update({ id }, { activo: false });
      await this.dominioValorRepository.softDelete({ id });

      return this.customSuccessResponse(
        this.toResponse(valor),
        null,
        HttpStatus.OK,
        'Valor de dominio eliminado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'DOM-13', 'Error eliminando valor de dominio');
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async listar(paginationDto: PaginationDominioValorDto) {
    const {
      page = 1,
      limit = 10,
      busqueda = '',
      todos,
      dominioId,
      padreId,
      activo,
    } = paginationDto;

    const qb = this.dominioValorRepository.createQueryBuilder('v');

    if (dominioId) {
      qb.andWhere('v.dominioId = :dominioId', { dominioId });
    }

    if (padreId) {
      qb.andWhere('v.padreId = :padreId', { padreId });
    }

    if (activo !== undefined) {
      qb.andWhere('v.activo = :activo', { activo });
    }

    if (busqueda) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('v.codigo LIKE :busqueda')
            .orWhere('v.nombre LIKE :busqueda')
            .orWhere('v.valor LIKE :busqueda');
        }),
        { busqueda: `%${busqueda}%` },
      );
    }

    qb.orderBy('v.ordenMenu', 'ASC').addOrderBy('v.nombre', 'ASC');

    if (!todos) {
      qb.skip((page - 1) * limit).take(limit);
    }

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((valor) => this.toResponse(valor)),
      metadata: todos
        ? { total, page: 1, limit: total }
        : { total, page, limit },
    };
  }

  private async obtenerValor(id: string): Promise<DominioValor> {
    const valor = await this.dominioValorRepository.findOne({
      where: { id },
    });
    if (!valor) {
      return this.customThrowError(
        '',
        'DOM-10-01',
        `Valor de dominio con ID ${id} no encontrado`,
      );
    }
    return valor;
  }

  /**
   * Valida que el dominio permita jerarquía, que el padre exista, pertenezca
   * al mismo dominio y no genere un ciclo con el valor que se actualiza.
   */
  private async validarPadre(
    dominio: Dominio,
    padreId: string,
    codigoBase: string,
    valorId?: string,
  ): Promise<DominioValor> {
    if (!dominio.permiteJerarquia) {
      return this.customThrowError(
        '',
        `${codigoBase}-03`,
        `El dominio ${dominio.codigo} no permite jerarquía (permiteJerarquia = false)`,
      );
    }

    if (valorId && padreId === valorId) {
      return this.customThrowError(
        '',
        `${codigoBase}-04`,
        'Un valor no puede ser su propio padre',
      );
    }

    const padre = await this.dominioValorRepository.findOne({
      where: { id: padreId },
    });
    if (!padre) {
      return this.customThrowError(
        '',
        `${codigoBase}-05`,
        `Valor padre con ID ${padreId} no encontrado`,
      );
    }

    if (padre.dominioId !== dominio.id) {
      return this.customThrowError(
        '',
        `${codigoBase}-06`,
        `El valor padre pertenece a otro dominio; debe ser del dominio ${dominio.codigo}`,
      );
    }

    if (valorId) {
      await this.validarCiclo(valorId, padre, codigoBase);
    }

    return padre;
  }

  /** Recorre la cadena de ancestros para garantizar que no vuelva al valor. */
  private async validarCiclo(
    valorId: string,
    padre: DominioValor,
    codigoBase: string,
  ): Promise<void> {
    const visitados = new Set<string>();
    let actual: DominioValor | null = padre;

    while (actual) {
      if (actual.id === valorId) {
        return this.customThrowError(
          '',
          `${codigoBase}-07`,
          'La jerarquía generaría un ciclo: el padre seleccionado desciende del valor que se actualiza',
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
        ? await this.dominioValorRepository.findOne({
            where: { id: actual.padreId },
          })
        : null;
    }
  }

  private construirNodo(
    valor: DominioValor,
    hijosPorPadre: Map<string, DominioValor[]>,
    visitados: Set<string>,
  ): NodoDominio {
    visitados.add(valor.id);

    const hijos = (hijosPorPadre.get(valor.id) ?? [])
      .filter((hijo) => !visitados.has(hijo.id))
      .map((hijo) => this.construirNodo(hijo, hijosPorPadre, visitados));

    visitados.delete(valor.id);

    return {
      id: valor.id,
      dominioId: valor.dominioId,
      padreId: valor.padreId ?? null,
      codigo: valor.codigo,
      nombre: valor.nombre,
      valor: valor.valor,
      ordenMenu: valor.ordenMenu,
      activo: valor.activo,
      atributos: deserializarJson(valor.atributos),
      hijos,
    };
  }

  private toResponse(valor: DominioValor) {
    return {
      ...valor,
      padreId: valor.padreId ?? null,
      atributos: deserializarJson(valor.atributos),
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
