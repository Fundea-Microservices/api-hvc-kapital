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
import { BaseService } from 'src/common';
import {
  CreateDominioDto,
  PaginationDominioDto,
  UpdateDominioDto,
} from './dto';
import { deserializarJson, serializarJson } from './utils/dominio.util';
import { AuthorizationExecutorService } from '../auth/usuarios/authorization-executor.service';

const PATH = 'dominios';

@Injectable()
export class DominiosService extends BaseService {
  protected readonly logger = new Logger('DominiosService');

  constructor(
    @Inject('DOMINIO_REPOSITORY')
    private readonly dominioRepository: Repository<Dominio>,

    @Inject('DOMINIO_VALOR_REPOSITORY')
    private readonly dominioValorRepository: Repository<DominioValor>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  /**
   * Crea un dominio maestro (PAIS, MONEDA, ...).
   */
  // DOM-01
  async create(createDto: CreateDominioDto) {
    try {
      const existente = await this.dominioRepository.findOne({
        where: { codigo: createDto.codigo },
      });
      if (existente) {
        return this.customThrowError(
          '',
          'DOM-01-01',
          `Ya existe un dominio con el código ${createDto.codigo}`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { esquemaAtributos, ...rest } = createDto;
      const dominio = this.dominioRepository.create({
        ...rest,
        esquemaAtributos: serializarJson(esquemaAtributos),
      });
      const saved = await this.dominioRepository.save(dominio);

      return this.customSuccessResponse(
        this.toResponse(saved),
        null,
        HttpStatus.CREATED,
        'Dominio creado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'DOM-01', 'Error al crear dominio');
    }
  }

  /**
   * Lista los dominios con paginación, búsqueda y filtros de estado.
   */
  // DOM-02
  async findAll(paginationDto: PaginationDominioDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        todos,
        activo,
        permiteJerarquia,
      } = paginationDto;

      const qb = this.dominioRepository.createQueryBuilder('d');

      if (busqueda) {
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where('d.codigo LIKE :busqueda')
              .orWhere('d.nombre LIKE :busqueda')
              .orWhere('d.descripcion LIKE :busqueda');
          }),
          { busqueda: `%${busqueda}%` },
        );
      }

      if (activo !== undefined) {
        qb.andWhere('d.activo = :activo', { activo });
      }

      if (permiteJerarquia !== undefined) {
        qb.andWhere('d.permiteJerarquia = :permiteJerarquia', {
          permiteJerarquia,
        });
      }

      qb.orderBy('d.nombre', 'ASC').addOrderBy('d.codigo', 'ASC');

      if (!todos) {
        qb.skip((page - 1) * limit).take(limit);
      }

      const [data, total] = await qb.getManyAndCount();

      const metadata = todos
        ? { total, page: 1, limit: total }
        : { total, page, limit };

      return this.customSuccessResponse(
        data.map((dominio) => this.toResponse(dominio)),
        metadata,
        HttpStatus.OK,
        'Dominios listados correctamente',
        PATH,
      );
    } catch (error) {
      this.customThrowError(error, 'DOM-02', 'Error listando dominios');
    }
  }

  /**
   * Obtiene un dominio por su UUID.
   */
  // DOM-03
  async findOne(id: string) {
    try {
      const dominio = await this.obtenerDominio(id);

      return this.customSuccessResponse(
        this.toResponse(dominio),
        null,
        HttpStatus.OK,
        'Dominio encontrado',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'DOM-03', 'Error obteniendo dominio');
    }
  }

  /**
   * Actualiza un dominio. El código se puede cambiar: los valores referencian
   * el dominio por UUID, no por código.
   */
  // DOM-04
  async update(id: string, updateDto: UpdateDominioDto) {
    try {
      const dominio = await this.obtenerDominio(id);

      if (updateDto.codigo && updateDto.codigo !== dominio.codigo) {
        const duplicado = await this.dominioRepository.findOne({
          where: { codigo: updateDto.codigo, id: Not(id) },
        });
        if (duplicado) {
          return this.customThrowError(
            '',
            'DOM-04-02',
            `Ya existe otro dominio con el código ${updateDto.codigo}`,
          );
        }
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { esquemaAtributos, ...rest } = updateDto;
      Object.assign(dominio, rest);
      if (esquemaAtributos !== undefined) {
        dominio.esquemaAtributos = serializarJson(esquemaAtributos);
      }

      const updated = await this.dominioRepository.save(dominio);

      return this.customSuccessResponse(
        this.toResponse(updated),
        null,
        HttpStatus.OK,
        'Dominio actualizado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'DOM-04', 'Error actualizando dominio');
    }
  }

  /**
   * Elimina (soft-delete) un dominio. Se bloquea si conserva valores vivos
   * para no dejar referencias huérfanas; en ese caso debe desactivarse.
   */
  // DOM-05
  async remove(id: string) {
    try {
      const dominio = await this.obtenerDominio(id);

      const valores = await this.dominioValorRepository.count({
        where: { dominioId: dominio.id },
      });
      if (valores > 0) {
        return this.customThrowError(
          '',
          'DOM-05-02',
          `No se puede eliminar el dominio ${dominio.codigo}: tiene ${valores} valor(es) asociado(s). Puede desactivarlo.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.dominioRepository.update({ id }, { activo: false });
      await this.dominioRepository.softDelete({ id });

      return this.customSuccessResponse(
        this.toResponse(dominio),
        null,
        HttpStatus.OK,
        'Dominio eliminado exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(error, 'DOM-05', 'Error eliminando dominio');
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async obtenerDominio(id: string): Promise<Dominio> {
    const dominio = await this.dominioRepository.findOne({ where: { id } });
    if (!dominio) {
      return this.customThrowError(
        '',
        'DOM-03-01',
        `Dominio con ID ${id} no encontrado`,
      );
    }
    return dominio;
  }

  /** Devuelve el dominio con `esquemaAtributos` ya parseado. */
  private toResponse(dominio: Dominio) {
    return {
      ...dominio,
      esquemaAtributos: deserializarJson(dominio.esquemaAtributos),
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
