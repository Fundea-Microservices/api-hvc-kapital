import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Not, Repository } from 'typeorm';
import { Keys } from 'database/entities/keys.entity';
import { BaseService } from 'src/common';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateApikeyDto, UpdateApikeyDto } from './dto';

@Injectable()
export class ApiKeysService extends BaseService {
  constructor(
    @Inject('KEYS_REPOSITORY')
    private readonly keysRepository: Repository<Keys>,
  ) {
    super();
  }

  protected readonly logger = new Logger('ApiKeysService');
  onModuleInit() {
    // this.$connect();
    this.logger.log('ApiKeysService initialized');
  }

  /**
   * Crea una nueva API Key
   * @param createApikeyDto DTO con los datos de la API Key a crear
   * @returns Objeto con el resultado de la operación
   */
  // AUT-40
  async create(createApikeyDto: CreateApikeyDto) {
    try {
      // Verificar si ya existe una API Key con el mismo nombre
      const existingKey = await this.keysRepository.findOne({
        where: { nombre: createApikeyDto.nombre },
      });

      if (existingKey) {
        return this.customThrowError(
          '',
          'AUT-40-01',
          `Ya existe una API Key con el nombre ${createApikeyDto.nombre}`,
        );
      }

      // Convertir el valor hexadecimal a Buffer
      const valueBuffer = Buffer.from(createApikeyDto.valor, 'hex');

      // Crear la API Key
      const apiKey = this.keysRepository.create({
        ...createApikeyDto,
        valor: valueBuffer,
        activo: createApikeyDto.activo ?? true,
      });

      const savedApiKey = await this.keysRepository.save(apiKey);

      // No devolver el valor por seguridad
      const { valor, ...result } = savedApiKey;

      return this.customSuccessResponse(
        result,
        null,
        HttpStatus.CREATED,
        'API Key creada exitosamente',
        'auth/api-keys',
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
      this.customThrowError(error, 'AUT-40', 'Error al crear API Key');
    }
  }

  /**
   * Obtiene todas las API Keys con paginación y filtros
   * @param paginationActiveDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con el resultado de la operación
   */
  // AUT-41
  async findAll(paginationActiveDto: PaginationActiveDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        activo,
      } = paginationActiveDto;

      // Configurar las condiciones de búsqueda
      const whereConditions: any = {};

      if (busqueda) {
        whereConditions.nombre = Like(`%${busqueda}%`);
      }

      if (activo !== undefined) {
        whereConditions.activo = activo;
      }

      // Consulta para obtener las API Keys
      const [apiKeys, total] = await this.keysRepository.findAndCount({
        where: whereConditions,
        take: limit,
        skip: (page - 1) * limit,
        order: {
          created_at: 'DESC',
        },
        select: [
          'id',
          'nombre',
          'descripcion',
          'activo',
          'created_at',
          'updated_at',
        ], // No incluir valor por seguridad
      });

      const metadata = { total, page, limit };

      return this.customSuccessResponse(
        apiKeys,
        metadata,
        HttpStatus.OK,
        'API Keys listadas correctamente',
        'auth/api-keys',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-41', 'Error encontrando API Keys');
    }
  }

  /**
   * Obtiene una API Key por ID
   * @param id ID de la API Key a buscar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-42
  async findOne(id: string) {
    try {
      const apiKey = await this.keysRepository.findOne({
        where: { id },
        select: [
          'id',
          'nombre',
          'descripcion',
          'activo',
          'created_at',
          'updated_at',
        ], // No incluir valor por seguridad
      });

      if (!apiKey) {
        return this.customThrowError(
          '',
          'AUT-42-01',
          `API Key con ID ${id} no encontrada`,
        );
      }

      return this.customSuccessResponse(
        apiKey,
        null,
        HttpStatus.OK,
        'API Key encontrada',
        'auth/api-keys',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-42', 'Error encontrando API Key');
    }
  }

  /**
   * Actualiza una API Key
   * @param id ID de la API Key a actualizar
   * @param updateApikeyDto DTO con los datos de la API Key a actualizar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-43
  async update(id: string, updateApikeyDto: UpdateApikeyDto) {
    try {
      const apiKey = await this.keysRepository.findOne({
        where: { id },
      });
      if (!apiKey) {
        return this.customThrowError(
          '',
          'AUT-43-01',
          `API Key con ID ${id} no encontrada`,
        );
      }

      // Verificar si ya existe otra API Key con el mismo nombre (si se está actualizando el nombre)
      if (updateApikeyDto.nombre && updateApikeyDto.nombre !== apiKey.nombre) {
        const existingKey = await this.keysRepository.findOne({
          where: {
            nombre: updateApikeyDto.nombre,
            id: Not(id),
          },
        });

        if (existingKey) {
          return this.customThrowError(
            '',
            'AUT-43-02',
            `Ya existe otra API Key con el nombre ${updateApikeyDto.nombre}`,
          );
        }
      }

      // Si se está actualizando el valor, convertir a Buffer
      const updateData: any = { ...updateApikeyDto };
      if (updateApikeyDto.valor) {
        updateData.valor = Buffer.from(updateApikeyDto.valor, 'hex');
      }

      // Actualizar los campos de la API Key
      Object.assign(apiKey, updateData);

      const updatedApiKey = await this.keysRepository.save(apiKey);

      // No devolver el valor por seguridad
      const { valor, ...result } = updatedApiKey;

      return this.customSuccessResponse(
        result,
        null,
        HttpStatus.OK,
        'API Key actualizada exitosamente',
        'auth/api-keys',
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
      this.customThrowError(error, 'AUT-43', 'Error al actualizar API Key');
    }
  }

  /**
   * Elimina una API Key
   * @param id ID de la API Key a eliminar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-44
  async remove(id: string) {
    try {
      const apiKey = await this.keysRepository.findOne({
        where: { id },
      });

      if (!apiKey) {
        return this.customThrowError(
          '',
          'AUT-44-01',
          `API Key con ID ${id} no encontrada`,
        );
      }

      await this.keysRepository.remove(apiKey);

      return this.customSuccessResponse(
        apiKey,
        null,
        HttpStatus.OK,
        'API Key eliminada exitosamente',
        'auth/api-keys',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-44', 'Error eliminando API Key');
    }
  }
}
