import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Brackets, Not, Repository } from 'typeorm';
import { TipoUsuario } from 'database/entities/tipo-usuario.entity';
import { Carousel } from 'database/entities/carousel.entity';
import { BaseService } from 'src/common';
import {
  CreateTipoUsuarioDto,
  EstadoTipoUsuarioFiltro,
  PaginationTipoUsuarioDto,
  UpdateTipoUsuarioDto,
} from './dto';
import { AuthorizationExecutorService } from '../usuarios/authorization-executor.service';

const PATH = 'auth/tipos-usuario';

@Injectable()
export class TiposUsuarioService extends BaseService {
  constructor(
    @Inject('TIPO_USUARIO_REPOSITORY')
    private readonly tipoUsuarioRepository: Repository<TipoUsuario>,

    @Inject('CAROUSEL_REPOSITORY')
    private readonly carouselRepository: Repository<Carousel>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  protected readonly logger = new Logger('TiposUsuarioService');
  onModuleInit() {
    this.logger.log('TiposUsuarioService initialized');
  }

  /**
   * Crea un nuevo tipo de usuario
   * @param createDto DTO con los datos del tipo de usuario
   * @returns Objeto con el resultado de la operación
   */
  // AUT-107
  async create(createDto: CreateTipoUsuarioDto) {
    try {
      const existente = await this.tipoUsuarioRepository.findOne({
        where: { codigo: createDto.codigo },
      });
      if (existente) {
        return this.customThrowError(
          '',
          'AUT-107-01',
          `Ya existe un tipo de usuario con el código ${createDto.codigo}`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      const tipo = this.tipoUsuarioRepository.create(createDto);
      const saved = await this.tipoUsuarioRepository.save(tipo);

      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Tipo de usuario creado exitosamente',
        PATH,
      );
    } catch (error) {
      // El 428 del punto de autorización debe llegar intacto al filtro
      // global (patrón de usuarios.service.ts): no se reenvuelve.
      if (error instanceof HttpException) throw error;
      if (
        error &&
        typeof error === 'object' &&
        error.statusCode &&
        error.success === false
      ) {
        throw error;
      }
      this.customThrowError(error, 'AUT-107', 'Error al crear tipo de usuario');
    }
  }

  /**
   * Lista los tipos de usuario con paginación, búsqueda y filtro por estado
   * (todos / activos / inactivos). No incluye los eliminados.
   * @param paginationDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con el resultado de la operación
   */
  // AUT-108
  async findAll(paginationDto: PaginationTipoUsuarioDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        todos,
        estado = EstadoTipoUsuarioFiltro.TODOS,
      } = paginationDto;

      const qb = this.tipoUsuarioRepository.createQueryBuilder('t');

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

      if (estado === EstadoTipoUsuarioFiltro.ACTIVOS) {
        qb.andWhere('t.activo = :activo', { activo: true });
      } else if (estado === EstadoTipoUsuarioFiltro.INACTIVOS) {
        qb.andWhere('t.activo = :activo', { activo: false });
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
        data,
        metadata,
        HttpStatus.OK,
        'Tipos de usuario listados correctamente',
        PATH,
      );
    } catch (error) {
      this.customThrowError(
        error,
        'AUT-108',
        'Error listando tipos de usuario',
      );
    }
  }

  /**
   * Obtiene un tipo de usuario por ID
   * @param id ID del tipo de usuario
   * @returns Objeto con el resultado de la operación
   */
  // AUT-109
  async findOne(id: string) {
    try {
      const tipo = await this.tipoUsuarioRepository.findOne({ where: { id } });
      if (!tipo) {
        return this.customThrowError(
          '',
          'AUT-109-01',
          `Tipo de usuario con ID ${id} no encontrado`,
        );
      }
      return this.customSuccessResponse(
        tipo,
        null,
        HttpStatus.OK,
        'Tipo de usuario encontrado',
        PATH,
      );
    } catch (error) {
      this.customThrowError(
        error,
        'AUT-109',
        'Error obteniendo tipo de usuario',
      );
    }
  }

  /**
   * Actualiza un tipo de usuario. El código solo se puede cambiar si ningún
   * elemento del carrusel lo usa (se guarda como texto en tiposUsuario).
   * @param id ID del tipo de usuario
   * @param updateDto DTO con los datos a actualizar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-110
  async update(id: string, updateDto: UpdateTipoUsuarioDto) {
    try {
      const tipo = await this.tipoUsuarioRepository.findOne({ where: { id } });
      if (!tipo) {
        return this.customThrowError(
          '',
          'AUT-110-01',
          `Tipo de usuario con ID ${id} no encontrado`,
        );
      }

      if (updateDto.codigo && updateDto.codigo !== tipo.codigo) {
        const duplicado = await this.tipoUsuarioRepository.findOne({
          where: { codigo: updateDto.codigo, id: Not(id) },
        });
        if (duplicado) {
          return this.customThrowError(
            '',
            'AUT-110-02',
            `Ya existe otro tipo de usuario con el código ${updateDto.codigo}`,
          );
        }

        const enUso = await this.contarCarouselsConTipo(tipo.codigo);
        if (enUso > 0) {
          return this.customThrowError(
            '',
            'AUT-110-03',
            `No se puede cambiar el código ${tipo.codigo}: lo usan ${enUso} elemento(s) del carrusel`,
          );
        }
      }

      // PUNTO DE CONTROL: validaciones y búsquedas completadas,
      // justo antes de la primera escritura en la base de datos.
      await this.executor.verificarPuntoDeAutorizacion();

      Object.assign(tipo, updateDto);
      const updated = await this.tipoUsuarioRepository.save(tipo);

      return this.customSuccessResponse(
        updated,
        null,
        HttpStatus.OK,
        'Tipo de usuario actualizado exitosamente',
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
        'AUT-110',
        'Error actualizando tipo de usuario',
      );
    }
  }

  /**
   * Elimina (soft-delete) un tipo de usuario. No se permite si algún
   * elemento del carrusel lo usa; en ese caso se puede desactivar.
   * @param id ID del tipo de usuario
   * @returns Objeto con el resultado de la operación
   */
  // AUT-111
  async remove(id: string) {
    try {
      const tipo = await this.tipoUsuarioRepository.findOne({ where: { id } });
      if (!tipo) {
        return this.customThrowError(
          '',
          'AUT-111-01',
          `Tipo de usuario con ID ${id} no encontrado`,
        );
      }

      const enUso = await this.contarCarouselsConTipo(tipo.codigo);
      if (enUso > 0) {
        return this.customThrowError(
          '',
          'AUT-111-02',
          `No se puede eliminar el tipo ${tipo.codigo}: lo usan ${enUso} elemento(s) del carrusel. Puede desactivarlo.`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.tipoUsuarioRepository.softDelete({ id });

      return this.customSuccessResponse(
        tipo,
        null,
        HttpStatus.OK,
        'Tipo de usuario eliminado exitosamente',
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
        'AUT-111',
        'Error eliminando tipo de usuario',
      );
    }
  }

  /**
   * Cuenta los elementos del carrusel (no eliminados) cuya lista
   * tiposUsuario incluye el código, con coincidencia exacta.
   */
  private contarCarouselsConTipo(codigo: string): Promise<number> {
    const patron = `%,${codigo.replace(/[!%_[]/g, (c) => `!${c}`)},%`;
    return (
      this.carouselRepository
        .createQueryBuilder('c')
        // ESCAPE '!' y no '\': TypeORM elimina la barra invertida del SQL.
        .where(
          "(',' + REPLACE(c.tiposUsuario, ' ', '') + ',') LIKE :patron ESCAPE '!'",
          { patron },
        )
        .getCount()
    );
  }
}
