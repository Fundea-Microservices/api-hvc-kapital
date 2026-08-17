import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Not, Repository } from 'typeorm';
import { Menu } from 'database/entities/menu.entity';
import { BaseService } from 'src/common';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateMenuDto, UpdateMenuDto } from './dto';

@Injectable()
export class MenuService extends BaseService {
  constructor(
    @Inject('MENU_REPOSITORY')
    private readonly menuRepository: Repository<Menu>,
  ) {
    super();
  }

  protected readonly logger = new Logger('MenuService');
  onModuleInit() {
    // this.$connect();
    this.logger.log('MenuService initialized');
  }

  /**
   * Crea un nuevo menú
   * @param createMenuDto DTO con los datos del menú a crear
   * @returns Objeto con el resultado de la operación
   */
  // AUT-50
  async create(createMenuDto: CreateMenuDto) {
    try {
      // Verificar si ya existe un menú con el mismo label
      const existingMenu = await this.menuRepository.findOne({
        where: { label: createMenuDto.label },
      });

      if (existingMenu) {
        return this.customThrowError(
          '',
          'AUT-50-01',
          `Ya existe un menú con el label ${createMenuDto.label}`,
        );
      }

      // Verificar si ya existe un menú con el mismo pathApp
      const existingPathApp = await this.menuRepository.findOne({
        where: { pathApp: createMenuDto.pathApp },
      });

      if (existingPathApp) {
        return this.customThrowError(
          '',
          'AUT-50-02',
          `Ya existe un menú con el pathApp ${createMenuDto.pathApp}`,
        );
      }

      // Verificar si ya existe un menú con el mismo pathWeb
      const existingPathWeb = await this.menuRepository.findOne({
        where: { pathWeb: createMenuDto.pathWeb },
      });

      if (existingPathWeb) {
        return this.customThrowError(
          '',
          'AUT-50-03',
          `Ya existe un menú con el pathWeb ${createMenuDto.pathWeb}`,
        );
      }

      // Crear el menú
      const menu = this.menuRepository.create({
        ...createMenuDto,
        principal: createMenuDto.principal ?? true,
        activo: createMenuDto.activo ?? true,
      });

      const savedMenu = await this.menuRepository.save(menu);

      return this.customSuccessResponse(
        savedMenu,
        null,
        HttpStatus.CREATED,
        'Menú creado exitosamente',
        'auth/menu',
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
      this.customThrowError(error, 'AUT-50', 'Error al crear menú');
    }
  }

  /**
   * Obtiene todos los menús con paginación y filtros
   * @param paginationActiveDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con el resultado de la operación
   */
  // AUT-51
  async findAll(paginationActiveDto: PaginationActiveDto) {
    try {
      const {
        page = 1,
        limit = 10,
        busqueda = '',
        activo,
        principal,
        todos,
      } = paginationActiveDto;

      // Configurar las condiciones de búsqueda
      const whereConditions: any = {};

      if (busqueda) {
        whereConditions.label = Like(`%${busqueda}%`);
      }

      if (activo !== undefined) {
        whereConditions.activo = activo;
      }

      if (principal !== undefined) {
        whereConditions.principal = principal;
      }

      //Si viene el parámetro todos, entonces devolvemos todos los menús sin paginación
      if (todos) {
        const [menus, total] = await this.menuRepository.findAndCount({
          where: whereConditions,
          order: {
            created_at: 'DESC',
          },
        });
        const metadata = { total, page, limit };

        return this.customSuccessResponse(
          menus,
          metadata,
          HttpStatus.OK,
          'Menús listados correctamente',
          'auth/menu',
        );
      }

      // Consulta para obtener los menús
      const [menus, total] = await this.menuRepository.findAndCount({
        where: whereConditions,
        take: limit,
        skip: (page - 1) * limit,
        order: {
          created_at: 'DESC',
        },
      });

      const metadata = { total, page, limit };

      return this.customSuccessResponse(
        menus,
        metadata,
        HttpStatus.OK,
        'Menús listados correctamente',
        'auth/menu',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-51', 'Error encontrando menús');
    }
  }

  /**
   * Obtiene un menú por ID
   * @param id ID del menú a buscar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-52
  async findOne(id: string) {
    try {
      const menu = await this.menuRepository.findOne({
        where: { id },
        relations: ['accesos'],
      });

      if (!menu) {
        return this.customThrowError(
          '',
          'AUT-52-01',
          `Menú con ID ${id} no encontrado`,
        );
      }

      return this.customSuccessResponse(
        menu,
        null,
        HttpStatus.OK,
        'Menú encontrado',
        'auth/menu',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-52', 'Error encontrando menú');
    }
  }

  /**
   * Actualiza un menú
   * @param id ID del menú a actualizar
   * @param updateMenuDto DTO con los datos del menú a actualizar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-53
  async update(id: string, updateMenuDto: UpdateMenuDto) {
    try {
      const menu = await this.menuRepository.findOne({ where: { id } });
      if (!menu) {
        return this.customThrowError(
          '',
          'AUT-53-01',
          `Menú con ID ${id} no encontrado`,
        );
      }

      // Verificar si ya existe otro menú con el mismo label (si se está actualizando el label)
      if (updateMenuDto.label && updateMenuDto.label !== menu.label) {
        const existingMenu = await this.menuRepository.findOne({
          where: {
            label: updateMenuDto.label,
            id: Not(id),
          },
        });

        if (existingMenu) {
          return this.customThrowError(
            '',
            'AUT-53-02',
            `Ya existe otro menú con el label ${updateMenuDto.label}`,
          );
        }
      }

      // Verificar si ya existe otro menú con el mismo pathApp (si se está actualizando el pathApp)
      if (updateMenuDto.pathApp && updateMenuDto.pathApp !== menu.pathApp) {
        const existingPathApp = await this.menuRepository.findOne({
          where: {
            pathApp: updateMenuDto.pathApp,
            id: Not(id),
          },
        });

        if (existingPathApp) {
          return this.customThrowError(
            '',
            'AUT-53-03',
            `Ya existe otro menú con el pathApp ${updateMenuDto.pathApp}`,
          );
        }
      }

      // Verificar si ya existe otro menú con el mismo pathWeb (si se está actualizando el pathWeb)
      if (updateMenuDto.pathWeb && updateMenuDto.pathWeb !== menu.pathWeb) {
        const existingPathWeb = await this.menuRepository.findOne({
          where: {
            pathWeb: updateMenuDto.pathWeb,
            id: Not(id),
          },
        });

        if (existingPathWeb) {
          return this.customThrowError(
            '',
            'AUT-53-04',
            `Ya existe otro menú con el pathWeb ${updateMenuDto.pathWeb}`,
          );
        }
      }

      // Actualizar los campos del menú
      Object.assign(menu, updateMenuDto);

      const updatedMenu = await this.menuRepository.save(menu);

      return this.customSuccessResponse(
        updatedMenu,
        null,
        HttpStatus.OK,
        'Menú actualizado exitosamente',
        'auth/menu',
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
      this.customThrowError(error, 'AUT-53', 'Error al actualizar menú');
    }
  }

  /**
   * Elimina un menú
   * @param id ID del menú a eliminar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-54
  async remove(id: string) {
    try {
      const menu = await this.menuRepository.findOne({ where: { id } });

      if (!menu) {
        return this.customThrowError(
          '',
          'AUT-54-01',
          `Menú con ID ${id} no encontrado`,
        );
      }

      await this.menuRepository.remove(menu);

      return this.customSuccessResponse(
        menu,
        null,
        HttpStatus.OK,
        'Menú eliminado exitosamente',
        'auth/menu',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-54', 'Error eliminando menú');
    }
  }
}
