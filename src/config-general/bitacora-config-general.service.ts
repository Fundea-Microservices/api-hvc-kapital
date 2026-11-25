import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BitacoraConfigGeneral } from 'database/entities/configuracion/bitacora-config-general.entity';
import { BaseService } from 'src/common';
import { PaginationBitacoraConfigDto } from './dto';
import { parsearJson } from './utils/config-general.util';

@Injectable()
export class BitacoraConfigGeneralService extends BaseService {
  protected readonly logger = new Logger(BitacoraConfigGeneralService.name);

  constructor(
    @Inject('BITACORA_CONFIG_GENERAL_REPOSITORY')
    private readonly bitacoraRepository: Repository<BitacoraConfigGeneral>,
  ) {
    super();
  }

  /** Consulta paginada e inmutable, ordenada por created_at DESC. */
  async findAll(paginationDto: PaginationBitacoraConfigDto) {
    try {
      const {
        page,
        limit,
        busqueda,
        todos,
        usuarioId,
        accion,
        origen,
        fechaDesde,
        fechaHasta,
        campoModificado,
      } = paginationDto;

      const query = this.bitacoraRepository
        .createQueryBuilder('bitacora')
        .leftJoinAndSelect('bitacora.usuario', 'usuario')
        .leftJoinAndSelect(
          'bitacora.bitacoraAutorizacion',
          'autorizacion',
        );

      if (busqueda) {
        const likeSearch = `%${busqueda.toLowerCase()}%`;
        query.andWhere(
          `(LOWER(bitacora.justificacion) LIKE :busqueda
            OR LOWER(bitacora.accion) LIKE :busqueda
            OR LOWER(bitacora.origen) LIKE :busqueda
            OR LOWER(usuario.nombreCompleto) LIKE :busqueda
            OR LOWER(usuario.userName) LIKE :busqueda
            OR LOWER(autorizacion.endpoint) LIKE :busqueda)`,
          { busqueda: likeSearch },
        );
      }

      if (usuarioId) {
        query.andWhere('bitacora.usuarioId = :usuarioId', { usuarioId });
      }

      if (accion) {
        query.andWhere('bitacora.accion = :accion', { accion });
      }

      if (origen) {
        query.andWhere('bitacora.origen = :origen', { origen });
      }

      if (fechaDesde) {
        query.andWhere('bitacora.created_at >= :fechaDesde', { fechaDesde });
      }

      if (fechaHasta) {
        query.andWhere(
          'bitacora.created_at < DATEADD(day, 1, CAST(:fechaHasta AS date))',
          { fechaHasta },
        );
      }

      if (campoModificado) {
        // El campo vive dentro de un arreglo JSON; LIKE es suficiente y la
        // búsqueda queda parametrizada. Se neutralizan comodines del usuario.
        const campo = campoModificado.replace(/[%_[\]]/g, '');
        query.andWhere('bitacora.camposModificados LIKE :campo', {
          campo: `%"${campo}"%`,
        });
      }

      if (todos) {
        const [data, total] = await query
          .orderBy('bitacora.created_at', 'DESC')
          .getManyAndCount();

        return this.customSuccessResponse(
          this.serializar(data),
          { total, page: 1, limit: total },
          HttpStatus.OK,
          'Bitácora de configuración listada correctamente',
          'config-general/bitacora',
        );
      }

      const [data, total] = await query
        .orderBy('bitacora.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return this.customSuccessResponse(
        this.serializar(data),
        { total, page, limit },
        HttpStatus.OK,
        'Bitácora de configuración listada correctamente',
        'config-general/bitacora',
      );
    } catch (error) {
      this.customThrowError(
        error,
        'CFG-20',
        'Error consultando la bitácora de configuración',
      );
    }
  }

  /** Devuelve los campos JSON parseados para el cliente. */
  private serializar(registros: BitacoraConfigGeneral[]) {
    return registros.map((registro) => ({
      ...registro,
      versionAnterior: parsearJson(registro.versionAnterior),
      versionNueva: parsearJson(registro.versionNueva),
      camposModificados: parsearJson(registro.camposModificados),
    }));
  }
}
