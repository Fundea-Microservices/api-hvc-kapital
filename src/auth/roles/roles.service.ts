import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Not, Repository } from 'typeorm';
import { Rol } from 'database/entities/rol.entity';
import { BaseService } from 'src/common';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateRolDto, UpdateRolDto } from './dto';

@Injectable()
export class RolesService extends BaseService {
  constructor(
    @Inject('ROL_REPOSITORY')
    private readonly rolRepository: Repository<Rol>,
  ) {
    super();
  }

  protected readonly logger = new Logger('RolService');
  onModuleInit() {
    // this.$connect();
    this.logger.log('RolService initialized');
  }

  /**
   * Crea un nuevo rol
   * @param createRolDto DTO con los datos del rol a crear
   * @returns Objeto con el resultado de la operación
   */
  // AUT-20
  async create(createRolDto: CreateRolDto) {
    try {
      // Solo puede existir un rol con invitado = true
      // Por lo que si el rol invitado = true, quitamos el invitado de los demás roles
      if (createRolDto.invitado) {
        const otherRoles = await this.rolRepository.find({
          where: {
            // Excluir el rol actual
            invitado: true, // Solo roles con invitado = true
          },
        });

        for (const otherRol of otherRoles) {
          otherRol.invitado = false; // Desactivar invitado en otros roles
          await this.rolRepository.save(otherRol);
        }
      }
      const rol = await this.rolRepository.create(createRolDto);
      const rolSaved = await this.rolRepository.save(rol);

      return this.customSuccessResponse(
        rolSaved,
        null,
        HttpStatus.CREATED,
        'Rol creado exitosamente',
        'auth/roles',
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
      this.customThrowError(error, 'AUT-20', 'Error al crear rol');
    }
  }

  /**
   * Obtiene todos los roles con paginación y filtros
   * @param paginationActiveDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con la lista de roles y metadatos de paginación
   */
  // AUT-21
  async findAll(paginationActiveDto: PaginationActiveDto) {
    try {
      const { page, limit, activo, busqueda, todos } = paginationActiveDto;

      // Si se requiere todos los roles, no aplicamos filtros solo de activos
      if (todos) {
        const [roles, total] = await this.rolRepository.findAndCount({
          where: { activo: true }, // Solo roles activos
          order: {
            nombre: 'ASC',
          },
        });

        const metadata = { total, page: 1, limit: total };

        return this.customSuccessResponse(
          roles,
          metadata,
          HttpStatus.OK,
          'Roles listados correctamente',
          'auth/roles',
        );
      }

      let customWhere = {};

      // Si se proporciona un valor para activo, lo agregamos al filtro
      if (activo !== undefined) {
        customWhere = { ...customWhere, active: activo };
      }

      // Si se proporciona un término de búsqueda, lo agregamos al filtro
      if (busqueda?.trim()) {
        customWhere = {
          ...customWhere,
          nombre: Like(`%${busqueda}%`),
        };
      }
      // Si no se especifica página o límite, usamos valores por defecto
      const [roles, total] = await this.rolRepository.findAndCount({
        where: customWhere,
        skip: (page - 1) * limit,
        take: limit,
        order: {
          nombre: 'ASC',
        },
      });

      const metadata = { total, page, limit };

      return this.customSuccessResponse(
        roles,
        metadata,
        HttpStatus.OK,
        'Roles listados correctamente',
        'auth/roles',
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
      this.customThrowError(error, 'AUT-21', 'Error encontrando roles');
    }
  }

  /**
   * Obtiene un rol por su ID
   * @param id ID del rol a buscar
   * @returns Objeto con el rol encontrado o un error si no existe
   */
  // AUT-22
  async findOne(id: string) {
    try {
      const rol = await this.rolRepository.findOneBy({ id });
      if (!rol) {
        return this.customThrowError(
          '',
          'AUT-22-01',
          `Rol con ID ${id} no encontrado`,
        );
      }
      return this.customSuccessResponse(
        rol,
        null,
        HttpStatus.OK,
        'Rol encontrado',
        'auth/roles',
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
      this.customThrowError(error, 'AUT-22', 'Error encontrando rol');
    }
  }

  /**
   * Actualiza un rol existente
   * @param updateRolDto DTO con los datos del rol a actualizar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-23
  async update(id: string, updateRolDto: UpdateRolDto) {
    try {
      const rol = await this.rolRepository.findOneBy({ id });
      if (!rol) {
        return this.customThrowError(
          '',
          'AUT-23-01',
          `Rol con ID ${id} no encontrado`,
        );
      }

      // Solo puede existir un rol con invitado = true
      // Por lo que si el rol invitado = true, quitamos el invitado de los demás roles
      if (updateRolDto.invitado) {
        const otherRoles = await this.rolRepository.find({
          where: {
            id: Not(rol.id), // Excluir el rol actual
            invitado: true, // Solo roles con guest = true
          },
        });

        for (const otherRol of otherRoles) {
          otherRol.invitado = false; // Desactivar invitado en otros roles
          await this.rolRepository.save(otherRol);
        }
      }

      // Asignar únicamente los campos permitidos
      rol.nombre = updateRolDto.nombre;
      rol.activo =
        updateRolDto.activo !== undefined ? updateRolDto.activo : rol.activo; // Mantener el estado actual si no se proporciona
      rol.invitado =
        updateRolDto.invitado !== undefined
          ? updateRolDto.invitado
          : rol.invitado;
      const updatedRol = await this.rolRepository.save(rol);

      return this.customSuccessResponse(
        updatedRol,
        null,
        HttpStatus.OK,
        'Rol actualizado exitosamente',
        'auth/roles',
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
      this.customThrowError(error, 'AUT-23', 'Error al actualizar rol');
    }
  }

  /**
   * Elimina un rol
   * @param id ID del rol a eliminar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-24
  async remove(id: string) {
    try {
      // Verificar si el rol existe
      const rol = await this.rolRepository.findOneBy({ id });
      if (!rol) {
        return this.customThrowError(
          '',
          'AUT-24-01',
          `Rol con ID ${id} no encontrado`,
        );
      }

      await this.rolRepository.softDelete({ id: rol.id });

      return this.customSuccessResponse(
        rol,
        null,
        HttpStatus.OK,
        'Rol eliminado exitosamente',
        'auth/roles',
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
      this.customThrowError(error, 'AUT-24', 'Error eliminando rol');
    }
  }
}
