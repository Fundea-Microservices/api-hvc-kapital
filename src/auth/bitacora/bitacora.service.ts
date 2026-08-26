import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Repository, Brackets } from 'typeorm';
import { BitacoraAutorizacion } from 'database/entities/bitacora-autorizacion.entity';
import { Usuario } from 'database/entities/usuario.entity';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateBitacoraDto } from './dto';

@Injectable()
export class BitacoraService extends BaseService {
  constructor(
    @Inject('BITACORA_AUTORIZACION_REPOSITORY')
    private readonly bitacoraRepository: Repository<BitacoraAutorizacion>,

    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,

    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,
  ) {
    super();
  }

  protected readonly logger = new Logger('BitacoraService');

  /**
   * Registra una entrada en la bitácora de autorización
   * @param createBitacoraDto DTO con los datos del registro
   * @returns Objeto con el resultado de la operación
   */
  // BIT-01
  async create(createBitacoraDto: CreateBitacoraDto) {
    try {
      // Verificar que el solicitante exista
      const solicitante = await this.usuarioRepository.findOneBy({
        id: createBitacoraDto.solicitanteId,
      });
      if (!solicitante) {
        return this.customThrowError(
          '',
          'BIT-01-01',
          `Solicitante con ID ${createBitacoraDto.solicitanteId} no encontrado`,
        );
      }

      // Verificar que el autorizador exista
      const autorizador = await this.usuarioRepository.findOneBy({
        id: createBitacoraDto.autorizadorId,
      });
      if (!autorizador) {
        return this.customThrowError(
          '',
          'BIT-01-02',
          `Autorizador con ID ${createBitacoraDto.autorizadorId} no encontrado`,
        );
      }

      // Verificar que el permiso exista
      const permiso = await this.permisoRepository.findOneBy({
        id: createBitacoraDto.permisoId,
      });
      if (!permiso) {
        return this.customThrowError(
          '',
          'BIT-01-03',
          `Permiso con ID ${createBitacoraDto.permisoId} no encontrado`,
        );
      }

      const registro = this.bitacoraRepository.create(createBitacoraDto);
      const saved = await this.bitacoraRepository.save(registro);

      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Registro de bitácora creado exitosamente',
        'auth/bitacora',
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
      this.customThrowError(error, 'BIT-01', 'Error al crear registro de bitácora');
    }
  }

  /**
   * Obtiene todos los registros de bitácon con paginación y filtros
   * @param paginationDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con la lista de registros y metadatos de paginación
   */
  // BIT-02
  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit, busqueda, todos } = paginationDto;

      const query = this.bitacoraRepository
        .createQueryBuilder('bitacora')
        .leftJoinAndSelect('bitacora.solicitante', 'solicitante')
        .leftJoinAndSelect('bitacora.autorizador', 'autorizador')
        .leftJoinAndSelect('bitacora.permiso', 'permiso');

      // Búsqueda por endpoint o nombre de usuario
      if (busqueda) {
        const likeSearch = `%${busqueda.toLowerCase()}%`;
        query.andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(bitacora.endpoint) LIKE :busqueda', {
              busqueda: likeSearch,
            })
              .orWhere('LOWER(solicitante.userName) LIKE :busqueda', {
                busqueda: likeSearch,
              })
              .orWhere('LOWER(autorizador.userName) LIKE :busqueda', {
                busqueda: likeSearch,
              })
              .orWhere('LOWER(permiso.codigo) LIKE :busqueda', {
                busqueda: likeSearch,
              });
          }),
        );
      }

      if (todos) {
        const [data, total] = await query
          .orderBy('bitacora.created_at', 'DESC')
          .getManyAndCount();

        return this.customSuccessResponse(
          data,
          { total, page: 1, limit: total },
          HttpStatus.OK,
          'Bitácora listada correctamente',
          'auth/bitacora',
        );
      }

      const [data, total] = await query
        .orderBy('bitacora.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const metadata = { total, page, limit };

      return this.customSuccessResponse(
        data,
        metadata,
        HttpStatus.OK,
        'Bitácora listada correctamente',
        'auth/bitacora',
      );
    } catch (error) {
      this.customThrowError(error, 'BIT-02', 'Error listando bitácora');
    }
  }

  /**
   * Obtiene un registro de bitácora por su ID
   * @param id ID del registro a buscar
   * @returns Objeto con el registro encontrado
   */
  // BIT-03
  async findOne(id: string) {
    try {
      const registro = await this.bitacoraRepository.findOne({
        where: { id },
        relations: ['solicitante', 'autorizador', 'permiso'],
      });

      if (!registro) {
        return this.customThrowError(
          '',
          'BIT-03-01',
          `Registro de bitácora con ID ${id} no encontrado`,
        );
      }

      return this.customSuccessResponse(
        registro,
        null,
        HttpStatus.OK,
        'Registro de bitácora encontrado',
        'auth/bitacora',
      );
    } catch (error) {
      this.customThrowError(error, 'BIT-03', 'Error buscando registro de bitácora');
    }
  }

  /**
   * Obtiene los registros de bitácora de un solicitante específico
   * @param solicitanteId UUID del solicitante
   * @param paginationDto Parámetros de paginación
   * @returns Registros de bitácora del solicitante
   */
  // BIT-04
  async findBySolicitante(solicitanteId: string, paginationDto: PaginationDto) {
    try {
      const { page, limit, todos } = paginationDto;

      const query = this.bitacoraRepository
        .createQueryBuilder('bitacora')
        .leftJoinAndSelect('bitacora.solicitante', 'solicitante')
        .leftJoinAndSelect('bitacora.autorizador', 'autorizador')
        .leftJoinAndSelect('bitacora.permiso', 'permiso')
        .where('bitacora.solicitanteId = :solicitanteId', { solicitanteId });

      if (todos) {
        const [data, total] = await query
          .orderBy('bitacora.created_at', 'DESC')
          .getManyAndCount();

        return this.customSuccessResponse(
          data,
          { total, page: 1, limit: total },
          HttpStatus.OK,
          'Bitácora del solicitante listada correctamente',
          'auth/bitacora',
        );
      }

      const [data, total] = await query
        .orderBy('bitacora.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const metadata = { total, page, limit };

      return this.customSuccessResponse(
        data,
        metadata,
        HttpStatus.OK,
        'Bitácora del solicitante listada correctamente',
        'auth/bitacora',
      );
    } catch (error) {
      this.customThrowError(error, 'BIT-04', 'Error listando bitácora del solicitante');
    }
  }

  /**
   * Obtiene los registros pendientes de autorización para un autorizador
   * @param autorizadorId UUID del autorizador
   * @param paginationDto Parámetros de paginación
   * @returns Registros pendientes de autorización
   */
  // BIT-05
  async findPendientes(autorizadorId: string, paginationDto: PaginationDto) {
    try {
      const { page, limit, todos } = paginationDto;

      const query = this.bitacoraRepository
        .createQueryBuilder('bitacora')
        .leftJoinAndSelect('bitacora.solicitante', 'solicitante')
        .leftJoinAndSelect('bitacora.autorizador', 'autorizador')
        .leftJoinAndSelect('bitacora.permiso', 'permiso')
        .where('bitacora.autorizadorId = :autorizadorId', { autorizadorId });

      if (todos) {
        const [data, total] = await query
          .orderBy('bitacora.created_at', 'DESC')
          .getManyAndCount();

        return this.customSuccessResponse(
          data,
          { total, page: 1, limit: total },
          HttpStatus.OK,
          'Registros pendientes listados correctamente',
          'auth/bitacora',
        );
      }

      const [data, total] = await query
        .orderBy('bitacora.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const metadata = { total, page, limit };

      return this.customSuccessResponse(
        data,
        metadata,
        HttpStatus.OK,
        'Registros pendientes listados correctamente',
        'auth/bitacora',
      );
    } catch (error) {
      this.customThrowError(error, 'BIT-05', 'Error listando registros pendientes');
    }
  }

  /**
   * Elimina un registro de bitácora (solo administradores)
   * @param id ID del registro a eliminar
   * @returns Objeto con el resultado de la operación
   */
  // BIT-06
  async remove(id: string) {
    try {
      const registro = await this.bitacoraRepository.findOneBy({ id });
      if (!registro) {
        return this.customThrowError(
          '',
          'BIT-06-01',
          `Registro de bitácora con ID ${id} no encontrado`,
        );
      }

      await this.bitacoraRepository.remove(registro);

      return this.customSuccessResponse(
        registro,
        null,
        HttpStatus.OK,
        'Registro de bitácora eliminado exitosamente',
        'auth/bitacora',
      );
    } catch (error) {
      this.customThrowError(error, 'BIT-06', 'Error eliminando registro de bitácora');
    }
  }
}
