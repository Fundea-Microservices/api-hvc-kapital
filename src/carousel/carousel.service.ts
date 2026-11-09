import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { Carousel } from 'database/entities/carousel.entity';
import { BaseService } from 'src/common';
import {
  CreateCarouselDto,
  PaginationCarouselDto,
  UpdateCarouselDto,
} from './dto';
import { AuthorizationExecutorService } from 'src/auth/usuarios/authorization-executor.service';
import { StorageService } from 'src/storage/services/storage.service';

const PATH = 'config/carousel';

/** Categoría del módulo de storage para las imágenes del carrusel. */
export const CAROUSEL_CATEGORIA = 'carousel';
const PREFIJO_STORAGE = `storage/${CAROUSEL_CATEGORIA}/`;

@Injectable()
export class CarouselService extends BaseService {
  constructor(
    @Inject('CAROUSEL_REPOSITORY')
    private readonly carouselRepository: Repository<Carousel>,

    private readonly executor: AuthorizationExecutorService,

    private readonly storageService: StorageService,
  ) {
    super();
  }

  protected readonly logger = new Logger('CarouselService');
  onModuleInit() {
    this.logger.log('CarouselService initialized');
  }

  /**
   * Crea un nuevo elemento del carrusel
   * @param createCarouselDto DTO con los datos del elemento a crear
   * @param file Imagen opcional; si viene, se sube y reemplaza a fotoUrl
   * @returns Objeto con el resultado de la operación
   */
  // CFG-01
  async create(
    createCarouselDto: CreateCarouselDto,
    file?: Express.Multer.File,
  ) {
    // Ruta del archivo subido mientras el registro aún no se ha guardado:
    // si algo falla después de subirlo, se elimina para no dejar huérfanos.
    let imagenPendiente: string | null = null;
    try {
      this.validarRangoFechas(
        createCarouselDto.fechaInicio,
        createCarouselDto.fechaFin,
        'CFG-01-01',
      );

      if (!file && !createCarouselDto.fotoUrl) {
        return this.customThrowError(
          '',
          'CFG-01-02',
          'Debe adjuntar la imagen (campo file) o indicar fotoUrl',
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      if (file) {
        imagenPendiente = await this.subirImagen(file);
      }

      const carousel = this.carouselRepository.create({
        ...createCarouselDto,
        fotoUrl: imagenPendiente ?? createCarouselDto.fotoUrl,
      });
      const saved = await this.carouselRepository.save(carousel);
      imagenPendiente = null;

      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Elemento del carrusel creado exitosamente',
        PATH,
      );
    } catch (error) {
      if (imagenPendiente) await this.eliminarImagenSiHuerfana(imagenPendiente);
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
      this.customThrowError(
        error,
        'CFG-01',
        'Error al crear elemento del carrusel',
      );
    }
  }

  /**
   * Obtiene los elementos del carrusel con paginación y filtros
   * @param paginationDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con el resultado de la operación
   */
  // CFG-02
  async findAll(paginationDto: PaginationCarouselDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        todos,
        activo,
        visibleWeb,
        visibleApp,
        vigente,
      } = paginationDto;

      const qb = this.carouselRepository.createQueryBuilder('c');

      if (busqueda) {
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where('c.titulo LIKE :busqueda')
              .orWhere('c.subtitulo LIKE :busqueda')
              .orWhere('c.codigo LIKE :busqueda');
          }),
          { busqueda: `%${busqueda}%` },
        );
      }
      if (activo !== undefined) {
        qb.andWhere('c.activo = :activo', { activo });
      }
      if (visibleWeb !== undefined) {
        qb.andWhere('c.visibleWeb = :visibleWeb', { visibleWeb });
      }
      if (visibleApp !== undefined) {
        qb.andWhere('c.visibleApp = :visibleApp', { visibleApp });
      }
      if (vigente) {
        const ahora = new Date();
        qb.andWhere('(c.fechaInicio IS NULL OR c.fechaInicio <= :ahora)', {
          ahora,
        }).andWhere('(c.fechaFin IS NULL OR c.fechaFin >= :ahora)', { ahora });
      }

      qb.orderBy('c.orden', 'ASC').addOrderBy('c.created_at', 'DESC');

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
        'Elementos del carrusel listados correctamente',
        PATH,
      );
    } catch (error) {
      this.customThrowError(
        error,
        'CFG-02',
        'Error listando elementos del carrusel',
      );
    }
  }

  /**
   * Obtiene un elemento del carrusel por ID
   * @param id ID del elemento a buscar
   * @returns Objeto con el resultado de la operación
   */
  // CFG-03
  async findOne(id: string) {
    try {
      const carousel = await this.carouselRepository.findOne({
        where: { carouselId: id },
      });
      if (!carousel) {
        return this.customThrowError(
          '',
          'CFG-03-01',
          `Elemento del carrusel con ID ${id} no encontrado`,
        );
      }
      return this.customSuccessResponse(
        carousel,
        null,
        HttpStatus.OK,
        'Elemento del carrusel encontrado',
        PATH,
      );
    } catch (error) {
      this.customThrowError(
        error,
        'CFG-03',
        'Error obteniendo elemento del carrusel',
      );
    }
  }

  /**
   * Actualiza un elemento del carrusel
   * @param id ID del elemento a actualizar
   * @param updateCarouselDto DTO con los datos a actualizar
   * @returns Objeto con el resultado de la operación
   */
  // CFG-04
  async update(id: string, updateCarouselDto: UpdateCarouselDto) {
    try {
      const carousel = await this.carouselRepository.findOne({
        where: { carouselId: id },
      });
      if (!carousel) {
        return this.customThrowError(
          '',
          'CFG-04-01',
          `Elemento del carrusel con ID ${id} no encontrado`,
        );
      }

      // El rango se valida contra el resultado final (lo enviado + lo guardado).
      this.validarRangoFechas(
        updateCarouselDto.fechaInicio !== undefined
          ? updateCarouselDto.fechaInicio
          : carousel.fechaInicio,
        updateCarouselDto.fechaFin !== undefined
          ? updateCarouselDto.fechaFin
          : carousel.fechaFin,
        'CFG-04-02',
      );

      // PUNTO DE CONTROL: validaciones y búsquedas completadas,
      // justo antes de la primera escritura en la base de datos.
      await this.executor.verificarPuntoDeAutorizacion();

      const fotoAnterior = carousel.fotoUrl;
      Object.assign(carousel, updateCarouselDto);
      const updated = await this.carouselRepository.save(carousel);

      if (fotoAnterior !== updated.fotoUrl) {
        await this.eliminarImagenSiHuerfana(fotoAnterior);
      }

      return this.customSuccessResponse(
        updated,
        null,
        HttpStatus.OK,
        'Elemento del carrusel actualizado exitosamente',
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
        'CFG-04',
        'Error actualizando elemento del carrusel',
      );
    }
  }

  /**
   * Elimina (soft-delete) un elemento del carrusel: llena deleted_at y
   * el registro deja de aparecer en las consultas.
   * @param id ID del elemento a eliminar
   * @returns Objeto con el resultado de la operación
   */
  // CFG-05
  async remove(id: string) {
    try {
      const carousel = await this.carouselRepository.findOne({
        where: { carouselId: id },
      });
      if (!carousel) {
        return this.customThrowError(
          '',
          'CFG-05-01',
          `Elemento del carrusel con ID ${id} no encontrado`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      await this.carouselRepository.softDelete({ carouselId: id });

      return this.customSuccessResponse(
        carousel,
        null,
        HttpStatus.OK,
        'Elemento del carrusel eliminado exitosamente',
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
        'CFG-05',
        'Error eliminando elemento del carrusel',
      );
    }
  }

  /**
   * Carga o reemplaza la imagen de un elemento del carrusel. La imagen
   * anterior se elimina del disco si ningún otro registro la usa.
   * @param id ID del elemento
   * @param file Imagen recibida en el campo multipart `file`
   * @returns Objeto con el resultado de la operación
   */
  // CFG-06
  async cambiarImagen(id: string, file?: Express.Multer.File) {
    let imagenPendiente: string | null = null;
    try {
      if (!file) {
        return this.customThrowError(
          '',
          'CFG-06-01',
          'Debe adjuntar la imagen en el campo file',
        );
      }

      const carousel = await this.carouselRepository.findOne({
        where: { carouselId: id },
      });
      if (!carousel) {
        return this.customThrowError(
          '',
          'CFG-06-02',
          `Elemento del carrusel con ID ${id} no encontrado`,
        );
      }

      // PUNTO DE CONTROL: validaciones completadas, justo antes de escribir.
      await this.executor.verificarPuntoDeAutorizacion();

      imagenPendiente = await this.subirImagen(file);

      const fotoAnterior = carousel.fotoUrl;
      carousel.fotoUrl = imagenPendiente;
      const updated = await this.carouselRepository.save(carousel);
      imagenPendiente = null;

      await this.eliminarImagenSiHuerfana(fotoAnterior);

      return this.customSuccessResponse(
        updated,
        null,
        HttpStatus.OK,
        'Imagen del carrusel actualizada exitosamente',
        PATH,
      );
    } catch (error) {
      if (imagenPendiente) await this.eliminarImagenSiHuerfana(imagenPendiente);
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
        'CFG-06',
        'Error actualizando imagen del carrusel',
      );
    }
  }

  /**
   * Sube la imagen con el módulo de storage (valida tamaño, MIME, extensión
   * y magic number según la categoría `carousel`).
   * @returns Ruta pública, ej. storage/carousel/banner-1794211200000.jpg
   */
  private async subirImagen(file: Express.Multer.File): Promise<string> {
    const resultado = await this.storageService.uploadFile({
      file,
      categoria: CAROUSEL_CATEGORIA,
    });
    const { url } = resultado.data as { url: string };
    return url;
  }

  /**
   * Borra del disco una imagen de storage/carousel/ si ningún registro
   * (incluidos los eliminados lógicamente) la referencia. Las rutas externas
   * u otras categorías no se tocan. Nunca lanza: un fallo aquí no debe
   * revertir la operación principal.
   */
  private async eliminarImagenSiHuerfana(fotoUrl?: string | null) {
    if (!fotoUrl || !fotoUrl.startsWith(PREFIJO_STORAGE)) return;
    try {
      const enUso = await this.carouselRepository.count({
        where: { fotoUrl },
        withDeleted: true,
      });
      if (enUso > 0) return;

      await this.storageService.deleteFile(
        CAROUSEL_CATEGORIA,
        fotoUrl.slice(PREFIJO_STORAGE.length),
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar la imagen ${fotoUrl}: ${(error as Error)?.message}`,
      );
    }
  }

  /** fechaFin no puede ser anterior a fechaInicio (null = sin límite). */
  private validarRangoFechas(
    fechaInicio: Date | null | undefined,
    fechaFin: Date | null | undefined,
    codigo: string,
  ) {
    if (fechaInicio && fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      this.customThrowError(
        '',
        codigo,
        'La fechaFin no puede ser anterior a la fechaInicio',
      );
    }
  }
}
