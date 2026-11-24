import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Brackets, Not, Repository } from 'typeorm';
import { DominioValor } from 'database/entities/dominios/dominio-valor.entity';
import { DominioRelacion } from 'database/entities/dominios/dominio-relacion.entity';
import { BaseService } from 'src/common';
import {
  CreateDominioRelacionDto,
  PaginationDominioRelacionDto,
  UpdateDominioRelacionDto,
} from './dto';
import { deserializarJson, serializarJson } from '../utils/dominio.util';
import { AuthorizationExecutorService } from '../../auth/usuarios/authorization-executor.service';

const PATH = 'dominios/relaciones';

@Injectable()
export class DominioRelacionesService extends BaseService {
  protected readonly logger = new Logger('DominioRelacionesService');

  constructor(
    @Inject('DOMINIO_RELACION_REPOSITORY')
    private readonly dominioRelacionRepository: Repository<DominioRelacion>,

    @Inject('DOMINIO_VALOR_REPOSITORY')
    private readonly dominioValorRepository: Repository<DominioValor>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  /**
   * Crea una relación N:M entre dos valores de dominio. Evita vínculos
   * consigo mismo y combinaciones duplicadas (origen, destino, tipoRelacion).
   */
  // DOM-14
  async create(createDto: CreateDominioRelacionDto) {
    try {
      await this.validarExtremos(
        createDto.valorOrigenId,
        createDto.valorDestinoId,
        'DOM-14',
      );

      await this.validarDuplicado(
        createDto.valorOrigenId,
        createDto.valorDestinoId,
        createDto.tipoRelacion,
        'DOM-14',
      );

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { atributos, ...rest } = createDto;
      const relacion = this.dominioRelacionRepository.create({
        ...rest,
        atributos: serializarJson(atributos),
      });
      const saved = await this.dominioRelacionRepository.save(relacion);

      return this.customSuccessResponse(
        this.toResponse(saved),
        null,
        HttpStatus.CREATED,
        'Relación de dominio creada exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'DOM-14',
        'Error al crear relación de dominio',
      );
    }
  }

  /**
   * Lista relaciones con filtros por origen, destino, tipo y estado.
   */
  // DOM-15
  async findAll(paginationDto: PaginationDominioRelacionDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        todos,
        valorOrigenId,
        valorDestinoId,
        tipoRelacion,
        activo,
      } = paginationDto;

      const qb = this.dominioRelacionRepository.createQueryBuilder('r');

      if (valorOrigenId) {
        qb.andWhere('r.valorOrigenId = :valorOrigenId', { valorOrigenId });
      }

      if (valorDestinoId) {
        qb.andWhere('r.valorDestinoId = :valorDestinoId', { valorDestinoId });
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
        'Relaciones de dominio listadas correctamente',
        PATH,
      );
    } catch (error) {
      this.customThrowError(
        error,
        'DOM-15',
        'Error listando relaciones de dominio',
      );
    }
  }

  /**
   * Obtiene una relación por su UUID.
   */
  // DOM-16
  async findOne(id: string) {
    try {
      const relacion = await this.obtenerRelacion(id);

      return this.customSuccessResponse(
        this.toResponse(relacion),
        null,
        HttpStatus.OK,
        'Relación de dominio encontrada',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'DOM-16',
        'Error obteniendo relación de dominio',
      );
    }
  }

  /**
   * Actualiza una relación. Si cambian los extremos o el tipo, revalida
   * existencia, vínculo consigo mismo y duplicados.
   */
  // DOM-17
  async update(id: string, updateDto: UpdateDominioRelacionDto) {
    try {
      const relacion = await this.obtenerRelacion(id);

      const origenId = updateDto.valorOrigenId ?? relacion.valorOrigenId;
      const destinoId = updateDto.valorDestinoId ?? relacion.valorDestinoId;
      const tipoRelacion = updateDto.tipoRelacion ?? relacion.tipoRelacion;

      await this.validarExtremos(origenId, destinoId, 'DOM-17');

      await this.validarDuplicado(
        origenId,
        destinoId,
        tipoRelacion,
        'DOM-17',
        relacion.id,
      );

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const { atributos, ...rest } = updateDto;
      Object.assign(relacion, rest);
      relacion.valorOrigenId = origenId;
      relacion.valorDestinoId = destinoId;
      relacion.tipoRelacion = tipoRelacion;
      if (atributos !== undefined) {
        relacion.atributos = serializarJson(atributos);
      }

      const updated = await this.dominioRelacionRepository.save(relacion);

      return this.customSuccessResponse(
        this.toResponse(updated),
        null,
        HttpStatus.OK,
        'Relación de dominio actualizada exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'DOM-17',
        'Error actualizando relación de dominio',
      );
    }
  }

  /**
   * Elimina (soft-delete) una relación.
   */
  // DOM-18
  async remove(id: string) {
    try {
      const relacion = await this.obtenerRelacion(id);

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.dominioRelacionRepository.update({ id }, { activo: false });
      await this.dominioRelacionRepository.softDelete({ id });

      return this.customSuccessResponse(
        this.toResponse(relacion),
        null,
        HttpStatus.OK,
        'Relación de dominio eliminada exitosamente',
        PATH,
      );
    } catch (error) {
      if (this.esErrorDeNegocio(error)) throw error;
      this.customThrowError(
        error,
        'DOM-18',
        'Error eliminando relación de dominio',
      );
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async obtenerRelacion(id: string): Promise<DominioRelacion> {
    const relacion = await this.dominioRelacionRepository.findOne({
      where: { id },
    });
    if (!relacion) {
      return this.customThrowError(
        '',
        'DOM-16-01',
        `Relación de dominio con ID ${id} no encontrada`,
      );
    }
    return relacion;
  }

  private async validarExtremos(
    valorOrigenId: string,
    valorDestinoId: string,
    codigoBase: string,
  ): Promise<void> {
    if (valorOrigenId === valorDestinoId) {
      return this.customThrowError(
        '',
        `${codigoBase}-01`,
        'El valor origen y el valor destino deben ser distintos',
      );
    }

    const origen = await this.dominioValorRepository.findOne({
      where: { id: valorOrigenId },
    });
    if (!origen) {
      return this.customThrowError(
        '',
        `${codigoBase}-02`,
        `Valor origen con ID ${valorOrigenId} no encontrado`,
      );
    }

    const destino = await this.dominioValorRepository.findOne({
      where: { id: valorDestinoId },
    });
    if (!destino) {
      return this.customThrowError(
        '',
        `${codigoBase}-03`,
        `Valor destino con ID ${valorDestinoId} no encontrado`,
      );
    }
  }

  private async validarDuplicado(
    valorOrigenId: string,
    valorDestinoId: string,
    tipoRelacion: string,
    codigoBase: string,
    idExcluir?: string,
  ): Promise<void> {
    const existente = await this.dominioRelacionRepository.findOne({
      where: {
        valorOrigenId,
        valorDestinoId,
        tipoRelacion,
        ...(idExcluir ? { id: Not(idExcluir) } : {}),
      },
    });

    if (existente) {
      return this.customThrowError(
        '',
        `${codigoBase}-04`,
        `Ya existe una relación ${tipoRelacion} entre el valor origen ${valorOrigenId} y el valor destino ${valorDestinoId}`,
      );
    }
  }

  private toResponse(relacion: DominioRelacion) {
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
