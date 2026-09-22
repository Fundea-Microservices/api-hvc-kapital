import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Not, Repository } from 'typeorm';
import { Rol } from 'database/entities/rol.entity';
import { Config } from 'database/entities/config.entity';
import { BaseService } from 'src/common';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateRolDto, UpdateRolDto, RolListadoResponse } from './dto';

/** Llave del registro en la tabla Config que guarda el NOMBRE del rol por defecto. */
const CONFIG_LLAVE_ROL_DEFAULT = 'ROL_DEFAULT_ID';

@Injectable()
export class RolesService extends BaseService {
  constructor(
    @Inject('ROL_REPOSITORY')
    private readonly rolRepository: Repository<Rol>,
    @Inject('CONFIG_REPOSITORY')
    private readonly configRepository: Repository<Config>,
  ) {
    super();
  }

  protected readonly logger = new Logger('RolService');
  onModuleInit() {
    // this.$connect();
    this.logger.log('RolService initialized');
  }

  /**
   * Actualiza el registro de Config ROL_DEFAULT_ID con el nombre del rol
   * que se acaba de crear/actualizar (fail-open: si falla, solo advierte).
   * @param nombreRol Nombre del rol que pasa a ser el nuevo rol por defecto
   * @param contextCode Código de bitácora del método que invoca (AUT-20 / AUT-23)
   */
  private async syncRolDefault(
    nombreRol: string,
    contextCode: string,
  ): Promise<void> {
    try {
      const configRolDefault = await this.configRepository.findOne({
        where: { llave: CONFIG_LLAVE_ROL_DEFAULT, activo: true },
      });

      if (!configRolDefault) {
        this.logger.warn(
          `(${contextCode}) No existe el registro ${CONFIG_LLAVE_ROL_DEFAULT} en Config; ` +
            `no se pudo marcar "${nombreRol}" como rol por defecto.`,
        );
        return;
      }

      configRolDefault.valor = nombreRol;
      await this.configRepository.save(configRolDefault);

      this.logger.log(
        `(${contextCode}) ${CONFIG_LLAVE_ROL_DEFAULT} actualizado a "${nombreRol}".`,
      );
    } catch (error: any) {
      // Fail-open: el guardado del rol no se revierte si Config falla.
      this.logger.warn(
        `(${contextCode}) No se pudo actualizar ${CONFIG_LLAVE_ROL_DEFAULT}: ${
          error?.message ?? error
        }`,
      );
    }
  }

  /**
   * Lee una sola vez el valor de ROL_DEFAULT_ID desde Config.
   * @returns El nombre del rol por defecto o null si no existe/falla la lectura
   */
  private async getNombreRolDefault(): Promise<string | null> {
    try {
      const config = await this.configRepository.findOne({
        where: { llave: CONFIG_LLAVE_ROL_DEFAULT, activo: true },
      });
      return config ? config.valor : null;
    } catch (error: any) {
      this.logger.warn(
        `(AUT-21) No se pudo leer ${CONFIG_LLAVE_ROL_DEFAULT}: ${
          error?.message ?? error
        }`,
      );
      return null;
    }
  }

  /**
   * Agrega en memoria la bandera transitoria `porDefecto` a cada rol del listado.
   * @param roles Roles traídos de la BD
   * @param nombreRolDefault Valor actual de ROL_DEFAULT_ID (null si no existe)
   */
  private conPorDefecto(
    roles: Rol[],
    nombreRolDefault: string | null,
  ): RolListadoResponse[] {
    return roles.map((rol) => ({
      ...rol,
      porDefecto:
        nombreRolDefault !== null && rol.nombre === nombreRolDefault,
    }));
  }

  /**
   * Crea un nuevo rol
   * @param createRolDto DTO con los datos del rol a crear
   * @returns Objeto con el resultado de la operación
   */
  // AUT-20
  async create(createRolDto: CreateRolDto) {
    try {
      // Separamos el flag transitorio: no pertenece a la entidad Rol
      const { porDefecto, ...rolData } = createRolDto;

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
      const rol = await this.rolRepository.create(rolData);
      const rolSaved = await this.rolRepository.save(rol);

      // Si el frontend marcó "porDefecto", este rol pasa a ser el rol por defecto global
      if (porDefecto) {
        await this.syncRolDefault(rolSaved.nombre, 'AUT-20');
      }

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

      // 1 sola lectura a Config para saber cuál es el rol por defecto
      const nombreRolDefault = await this.getNombreRolDefault();

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
          this.conPorDefecto(roles, nombreRolDefault),
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
        this.conPorDefecto(roles, nombreRolDefault),
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

      // Mismo flag transitorio que en findAll: ¿es este el rol por defecto?
      const nombreRolDefault = await this.getNombreRolDefault();

      return this.customSuccessResponse(
        this.conPorDefecto([rol], nombreRolDefault)[0],
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

      // Si el frontend marcó "porDefecto", este rol pasa a ser el rol por defecto global
      if (updateRolDto.porDefecto) {
        await this.syncRolDefault(updatedRol.nombre, 'AUT-23');
      }

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
