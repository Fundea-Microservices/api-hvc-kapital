import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Not, Repository } from 'typeorm';
import { Puesto } from 'database/entities/puesto.entity';
import { BaseService } from 'src/common';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreatePuestoDto, UpdatePuestoDto } from './dto';

@Injectable()
export class PuestosService extends BaseService {
  constructor(
    @Inject('PUESTO_REPOSITORY')
    private readonly puestoRepository: Repository<Puesto>,
  ) {
    super();
  }

  protected readonly logger = new Logger('PuestoService');
  onModuleInit() {
    // this.$connect();
    this.logger.log('PuestoService initialized');
  }

  /**
   * Crea un nuevo puesto
   * @param createPuestoDto DTO con los datos del puesto a crear
   * @returns Objeto con el resultado de la operación
   */
  // AUT-30
  async create(createPuestoDto: CreatePuestoDto) {
    try {
      // Verificar si ya existe un puesto con el mismo nombre
      const existingPuesto = await this.puestoRepository.findOne({
        where: { nombre: createPuestoDto.nombre },
      });

      if (existingPuesto) {
        return this.customThrowError(
          '',
          'AUT-30-01',
          `Ya existe un puesto con el nombre ${createPuestoDto.nombre}`,
        );
      }

      const puesto = this.puestoRepository.create(createPuestoDto);
      const savedPuesto = await this.puestoRepository.save(puesto);

      return this.customSuccessResponse(
        savedPuesto,
        null,
        HttpStatus.CREATED,
        'Puesto creado exitosamente',
        'auth/puestos',
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
      this.customThrowError(error, 'AUT-30', 'Error al crear puesto');
    }
  }

  /**
   * Obtiene todos los puestos con paginación y filtros
   * @param paginationActiveDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con el resultado de la operación
   */
  // AUT-31
  async findAll(paginationActiveDto: PaginationActiveDto) {
    try {
      const { page = 1, limit = 10, busqueda = '' } = paginationActiveDto;

      // Configurar las condiciones de búsqueda
      const whereConditions: any = {};

      if (busqueda) {
        whereConditions.nombre = Like(`%${busqueda}%`);
      }

      // Consulta para obtener los puestos
      const [puestos, total] = await this.puestoRepository.findAndCount({
        where: whereConditions,
        take: limit,
        skip: (page - 1) * limit,
        order: {
          nombre: 'ASC',
        },
      });

      const metadata = { total, page, limit };

      return this.customSuccessResponse(
        puestos,
        metadata,
        HttpStatus.OK,
        'Puestos listados correctamente',
        'auth/puestos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-31', 'Error encontrando puestos');
    }
  }

  /**
   * Obtiene un puesto por ID
   * @param id ID del puesto a buscar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-32
  async findOne(id: string) {
    try {
      const puesto = await this.puestoRepository.findOne({
        where: { id },
      });
      if (!puesto) {
        return this.customThrowError(
          '',
          'AUT-32-01',
          `Puesto con ID ${id} no encontrado`,
        );
      }
      return this.customSuccessResponse(
        puesto,
        null,
        HttpStatus.OK,
        'Puesto encontrado',
        'auth/puestos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-32', 'Error encontrando puesto');
    }
  }

  /**
   * Actualiza un puesto
   * @param id ID del puesto a actualizar
   * @param updatePuestoDto DTO con los datos del puesto a actualizar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-33
  async update(id: string, updatePuestoDto: UpdatePuestoDto) {
    try {
      const puesto = await this.puestoRepository.findOne({
        where: { id },
      });
      if (!puesto) {
        return this.customThrowError(
          '',
          'AUT-33-01',
          `Puesto con ID ${id} no encontrado`,
        );
      }

      // Verificar si ya existe otro puesto con el mismo nombre (si se está actualizando el nombre)
      if (updatePuestoDto.nombre && updatePuestoDto.nombre !== puesto.nombre) {
        const existingPuesto = await this.puestoRepository.findOne({
          where: {
            nombre: updatePuestoDto.nombre,
            id: Not(id),
          },
        });

        if (existingPuesto) {
          return this.customThrowError(
            '',
            'AUT-33-02',
            `Ya existe otro puesto con el nombre ${updatePuestoDto.nombre}`,
          );
        }
      }

      // Actualizar los campos del puesto
      Object.assign(puesto, updatePuestoDto);

      const updatedPuesto = await this.puestoRepository.save(puesto);

      return this.customSuccessResponse(
        updatedPuesto,
        null,
        HttpStatus.OK,
        'Puesto actualizado exitosamente',
        'auth/puestos',
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
      this.customThrowError(error, 'AUT-33', 'Error al actualizar puesto');
    }
  }

  /**
   * Elimina un puesto
   * @param id ID del puesto a eliminar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-34
  async remove(id: string) {
    try {
      const puesto = await this.puestoRepository.findOne({
        where: { id },
      });

      if (!puesto) {
        return this.customThrowError(
          '',
          'AUT-34-01',
          `Puesto con ID ${id} no encontrado`,
        );
      }

      await this.puestoRepository.remove(puesto);

      return this.customSuccessResponse(
        puesto,
        null,
        HttpStatus.OK,
        'Puesto eliminado exitosamente',
        'auth/puestos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-34', 'Error eliminando puesto');
    }
  }
}
