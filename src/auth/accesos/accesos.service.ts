import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  IsNull,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { Acceso } from 'database/entities/acceso.entity';
import { Rol } from 'database/entities/rol.entity';
import { Menu } from 'database/entities/menu.entity';
import { BaseService } from 'src/common';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateAccesoDto, UpdateAccesoDto } from './dto';

@Injectable()
export class AccesosService extends BaseService {
  constructor(
    @Inject('ACCESO_REPOSITORY')
    private readonly accesoRepository: Repository<Acceso>,
    @Inject('ROL_REPOSITORY')
    private readonly rolRepository: Repository<Rol>,
    @Inject('MENU_REPOSITORY')
    private readonly menuRepository: Repository<Menu>,
  ) {
    super();
  }

  protected readonly logger = new Logger('AccesosService');
  onModuleInit() {
    // this.$connect();
    this.logger.log('AccesosService initialized');
  }

  /**
   * Crea un nuevo acceso
   * @param createAccesoDto DTO con los datos del acceso a crear
   * @returns Objeto con el resultado de la operación
   */
  // AUT-60
  async create(createAccesoDto: CreateAccesoDto) {
    try {
      const { rolId, menuId, ordenMenu, showApp, showWeb, activo, mainMenuId } =
        createAccesoDto;
      // Verificar si el rol existe
      const rol = await this.rolRepository.findOne({
        where: { id: rolId },
      });

      if (!rol) {
        return this.customThrowError(
          '',
          'AUT-60-01',
          `Rol con ID ${rolId} no encontrado`,
        );
      }

      // Verificar si el menú existe
      const menu = await this.menuRepository.findOne({
        where: { id: menuId },
      });

      if (!menu) {
        return this.customThrowError(
          '',
          'AUT-60-02',
          `Menú con ID ${menuId} no encontrado`,
        );
      }

      // Buscamos que exista el menu
      let orderM = Number(ordenMenu) === 0 ? 1 : Number(ordenMenu);
      if (isNaN(orderM)) {
        orderM = 1;
      }
      let accesoSaved = {};

      // Si el menu es principal, buscamos todos los menus de ese rol activos
      if (menu.principal) {
        // Si es necesario mover de lugar a los menus
        if (orderM < 100) {
          const menusRol = await this.accesoRepository.find({
            where: {
              rolId: rolId,
              mainMenuId: IsNull(),
              ordenMenu: MoreThanOrEqual(orderM),
            },
            order: { ordenMenu: 'ASC' },
          });
          // Recorremos los menus y les sumamos 1 al ordenMenu y guardamos
          for (const menuRol of menusRol) {
            menuRol.ordenMenu = menuRol.ordenMenu + 1;
            await this.accesoRepository.save(menuRol);
          }
        } else {
          // Order = 100 para mandar el acceso al final
          const maxOrder = await this.accesoRepository.findOne({
            where: { rolId: rolId, mainMenuId: IsNull() },
            order: { ordenMenu: 'DESC' },
          });
          if (maxOrder) {
            orderM = maxOrder.ordenMenu + 1;
          } else {
            // Si no se encontró un orden máximo, no hay menus
            orderM = 1;
          }
        }
        // Creamos el acceso principal
        const acceso = await this.accesoRepository.create({
          rolId: rolId,
          menuId: menuId,
          ordenMenu: orderM,
          showApp: showApp,
          showWeb: showWeb,
          activo: activo,
          mainMenuId: mainMenuId !== undefined ? mainMenuId : undefined,
        });
        accesoSaved = await this.accesoRepository.save(acceso);
      } else {
        // Si es un submenu, buscamos el listado de submenus
        // Si es necesario mover de lugar a los menus
        if (orderM < 100) {
          const submenusRol = await this.accesoRepository.find({
            where: {
              rolId: rolId,
              mainMenuId: mainMenuId,
              ordenMenu: MoreThanOrEqual(orderM),
            },
            order: { ordenMenu: 'ASC' },
          });
          // Recorremos los submenus y les sumamos 1 al ordenMenu y guardamos
          for (const submenuRol of submenusRol) {
            submenuRol.ordenMenu = submenuRol.ordenMenu + 1;
            await this.accesoRepository.save(submenuRol);
          }
        } else {
          // Order = 100 para mandar el acceso al final
          const maxOrder = await this.accesoRepository.findOne({
            where: { rolId: rolId, mainMenuId: mainMenuId },
            order: { ordenMenu: 'DESC' },
          });
          if (maxOrder) {
            orderM = maxOrder.ordenMenu + 1;
          } else {
            // Si no se encontró un orden máximo, no hay submenus
            orderM = 1;
          }
        }
        // Creamos el acceso al submenú
        const acceso = await this.accesoRepository.create({
          rolId: rolId,
          menuId: menuId,
          ordenMenu: orderM,
          showApp: showApp,
          showWeb: showWeb,
          activo: activo,
          mainMenuId: mainMenuId !== undefined ? mainMenuId : undefined,
        });
        accesoSaved = await this.accesoRepository.save(acceso);
      }

      return this.customSuccessResponse(
        accesoSaved,
        null,
        HttpStatus.CREATED,
        'Acceso creado exitosamente',
        'auth/accesos',
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
      this.customThrowError(error, 'AUT-60', 'Error al crear acceso');
    }
  }

  /**
   * Obtiene todos los accesos con paginación y filtros
   * @param paginationActiveDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con el resultado de la operación
   */
  // AUT-61
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

      if (activo !== undefined) {
        whereConditions.activo = activo;
      }

      // Consulta para obtener los accesos
      const queryBuilder = this.accesoRepository
        .createQueryBuilder('acceso')
        .leftJoinAndSelect('acceso.rol', 'rol')
        .leftJoinAndSelect('acceso.menu', 'menu')
        .where(whereConditions);

      // Agregar búsqueda si se proporciona
      if (busqueda) {
        queryBuilder.andWhere(
          '(rol.nombre LIKE :search OR menu.label LIKE :search)',
          { search: `%${busqueda}%` },
        );
      }

      // Paginación y ordenamiento
      const [accesos, total] = await queryBuilder
        .take(limit)
        .skip((page - 1) * limit)
        .orderBy('acceso.created_at', 'DESC')
        .getManyAndCount();

      const metadata = { total, page, limit };

      return this.customSuccessResponse(
        accesos,
        metadata,
        HttpStatus.OK,
        'Accesos listados correctamente',
        'auth/accesos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-61', 'Error encontrando accesos');
    }
  }

  /**
   * Obtiene un acceso por ID
   * @param id ID del acceso a buscar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-62
  async findOne(id: string) {
    try {
      const acceso = await this.accesoRepository.findOne({
        where: { id },
        relations: ['rol', 'menu'],
      });

      if (!acceso) {
        return this.customThrowError(
          '',
          'AUT-62-01',
          `Acceso con ID ${id} no encontrado`,
        );
      }

      return this.customSuccessResponse(
        acceso,
        null,
        HttpStatus.OK,
        'Acceso encontrado',
        'auth/accesos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-62', 'Error encontrando acceso');
    }
  }

  /**
   * Actualiza un acceso
   * @param id ID del acceso a actualizar
   * @param updateAccesoDto DTO con los datos del acceso a actualizar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-63
  async update(id: string, updateAccesoDto: UpdateAccesoDto) {
    try {
      const acceso = await this.accesoRepository.findOne({
        where: { id },
      });
      if (!acceso) {
        return this.customThrowError(
          '',
          'AUT-63-01',
          `Acceso con ID ${id} no encontrado`,
        );
      }

      // Verificar si el rol existe (si se está actualizando)
      if (updateAccesoDto.rolId && updateAccesoDto.rolId !== acceso.rolId) {
        const rol = await this.rolRepository.findOne({
          where: { id: updateAccesoDto.rolId },
        });

        if (!rol) {
          return this.customThrowError(
            '',
            'AUT-63-02',
            `Rol con ID ${updateAccesoDto.rolId} no encontrado`,
          );
        }
      }

      // Verificar si el menú existe (si se está actualizando)
      if (updateAccesoDto.menuId && updateAccesoDto.menuId !== acceso.menuId) {
        const menu = await this.menuRepository.findOne({
          where: { id: updateAccesoDto.menuId },
        });

        if (!menu) {
          return this.customThrowError(
            '',
            'AUT-63-03',
            `Menú con ID ${updateAccesoDto.menuId} no encontrado`,
          );
        }
      }

      // Verificar si el mainMenuId existe (si se está actualizando)
      if (
        updateAccesoDto.mainMenuId &&
        updateAccesoDto.mainMenuId !== acceso.mainMenuId
      ) {
        const mainMenu = await this.menuRepository.findOne({
          where: { id: updateAccesoDto.mainMenuId },
        });

        if (!mainMenu) {
          return this.customThrowError(
            '',
            'AUT-63-04',
            `Menú principal con ID ${updateAccesoDto.mainMenuId} no encontrado`,
          );
        }
      }

      // Verificar si ya existe otro acceso con la misma combinación rol-menú (si se están actualizando)
      if (
        (updateAccesoDto.rolId && updateAccesoDto.rolId !== acceso.rolId) ||
        (updateAccesoDto.menuId && updateAccesoDto.menuId !== acceso.menuId)
      ) {
        const existingAcceso = await this.accesoRepository.findOne({
          where: {
            rolId: updateAccesoDto.rolId || acceso.rolId,
            menuId: updateAccesoDto.menuId || acceso.menuId,
            id: Not(id),
          },
        });

        if (existingAcceso) {
          return this.customThrowError(
            '',
            'AUT-63-05',
            `Ya existe otro acceso para esta combinación de rol y menú`,
          );
        }
      }

      // Si el orden no cambia, solo actualizamos los campos que cambian
      if (acceso.ordenMenu === updateAccesoDto.ordenMenu) {
        Object.assign(acceso, updateAccesoDto);
        updateAccesoDto = await this.accesoRepository.save(acceso);
      }

      // Para los submenus, revisamos el orden y los actualizamos
      if (
        updateAccesoDto.ordenMenu !== undefined &&
        updateAccesoDto.ordenMenu !== acceso.ordenMenu
      ) {
        const oldOrder = acceso.ordenMenu || 1;
        const newOrderRaw = Number(updateAccesoDto.ordenMenu);
        let newOrder = isNaN(newOrderRaw) ? 1 : newOrderRaw;

        const oldRolId = acceso.rolId;
        const oldMainMenuId =
          acceso.mainMenuId === undefined ? null : acceso.mainMenuId;
        const newRolId = updateAccesoDto.rolId || acceso.rolId;
        const newMainMenuId =
          updateAccesoDto.mainMenuId === undefined
            ? oldMainMenuId
            : updateAccesoDto.mainMenuId === null
              ? null
              : updateAccesoDto.mainMenuId;

        const buildWhere = (
          rolIdVal: string,
          mainMenuIdVal: any,
          orderCond: any,
        ) => {
          const where: any = { rolId: rolIdVal, ordenMenu: orderCond };
          if (mainMenuIdVal === null) {
            where.mainMenuId = IsNull();
          } else {
            where.mainMenuId = mainMenuIdVal;
          }
          return where;
        };

        // Movimiento dentro del mismo grupo (mismo rol y mismo mainMenu)
        if (oldRolId === newRolId && oldMainMenuId === newMainMenuId) {
          if (newOrder < oldOrder) {
            // mover hacia arriba: incrementar +1 a los que están entre newOrder .. oldOrder-1
            const items = await this.accesoRepository.find({
              where: buildWhere(
                newRolId,
                newMainMenuId,
                MoreThanOrEqual(newOrder),
              ),
              order: { ordenMenu: 'ASC' },
            });
            for (const it of items) {
              if (it.ordenMenu >= newOrder && it.ordenMenu < oldOrder) {
                it.ordenMenu = it.ordenMenu + 1;
                await this.accesoRepository.save(it);
              }
            }
          } else {
            // mover hacia abajo: decrementar -1 a los que están entre oldOrder+1 .. newOrder
            const items = await this.accesoRepository.find({
              where: buildWhere(
                newRolId,
                newMainMenuId,
                LessThanOrEqual(newOrder),
              ),
              order: { ordenMenu: 'ASC' },
            });
            for (const it of items) {
              if (it.ordenMenu <= newOrder && it.ordenMenu > oldOrder) {
                it.ordenMenu = it.ordenMenu - 1;
                await this.accesoRepository.save(it);
              }
            }
          }
        } else {
          // Movimiento entre grupos (cambia rol o mainMenu)
          // 1) Cerrar hueco en el grupo antiguo: decrementar -1 a los > oldOrder
          const itemsOld = await this.accesoRepository.find({
            where: buildWhere(oldRolId, oldMainMenuId, MoreThan(oldOrder)),
            order: { ordenMenu: 'ASC' },
          });
          for (const it of itemsOld) {
            it.ordenMenu = it.ordenMenu - 1;
            await this.accesoRepository.save(it);
          }

          // 2) Abrir espacio en el nuevo grupo: si newOrder >= 100 -> append al final, sino incrementar +1 a >= newOrder
          if (newOrder >= 100) {
            const maxOrder = await this.accesoRepository.findOne({
              where:
                newMainMenuId === null
                  ? { rolId: newRolId, mainMenuId: IsNull() }
                  : { rolId: newRolId, mainMenuId: newMainMenuId },
              order: { ordenMenu: 'DESC' },
            });
            newOrder = maxOrder ? maxOrder.ordenMenu + 1 : 1;
          } else {
            const itemsNew = await this.accesoRepository.find({
              where: buildWhere(
                newRolId,
                newMainMenuId,
                MoreThanOrEqual(newOrder),
              ),
              order: { ordenMenu: 'ASC' },
            });
            for (const it of itemsNew) {
              it.ordenMenu = it.ordenMenu + 1;
              await this.accesoRepository.save(it);
            }
          }
        }

        updateAccesoDto.ordenMenu = newOrder;
      }
      // if(acceso.mainMenuId){
      //   let orderM = updateAccesoDto.ordenMenu || 1;
      //   // Validamos si se va a mover hacia arriba o hacia abajo
      //   if(orderM < acceso.ordenMenu){
      //     const submenusSiguentesRol = await this.accesoRepository.find({
      //       where: { rolId: updateAccesoDto.rolId, mainMenuId: updateAccesoDto.mainMenuId, ordenMenu: LessThanOrEqual(orderM) },
      //       order: { ordenMenu: 'ASC' },
      //     });
      //     // Recorremos los submenus y les sumamos 1 al ordenMenu y guardamos
      //     for (const submenuRol of submenusSiguentesRol) {
      //       submenuRol.ordenMenu = submenuRol.ordenMenu + 1;
      //       await this.accesoRepository.save(submenuRol);
      //     }
      //   } else {
      //     const submenusAnterioresRol = await this.accesoRepository.find({
      //       where: { rolId: updateAccesoDto.rolId, mainMenuId: updateAccesoDto.mainMenuId, ordenMenu: MoreThanOrEqual(orderM) },
      //       order: { ordenMenu: 'ASC' },
      //     });
      //     // Recorremos los submenus y les sumamos 1 al ordenMenu y guardamos
      //     for (const submenuRol of submenusAnterioresRol) {
      //       submenuRol.ordenMenu = submenuRol.ordenMenu -1;
      //       await this.accesoRepository.save(submenuRol);
      //     }
      //   }
      // }

      // Actualizar los campos del acceso
      Object.assign(acceso, updateAccesoDto);

      const updatedAcceso = await this.accesoRepository.save(acceso);

      return this.customSuccessResponse(
        updatedAcceso,
        null,
        HttpStatus.OK,
        'Acceso actualizado exitosamente',
        'auth/accesos',
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
      this.customThrowError(error, 'AUT-63', 'Error al actualizar acceso');
    }
  }

  /**
   * Elimina un acceso
   * @param id ID del acceso a eliminar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-64
  async remove(id: string) {
    try {
      let accesoDeleted = {};
      const acceso = await this.accesoRepository.findOne({
        where: { id },
      });

      if (!acceso) {
        return this.customThrowError(
          '',
          'AUT-64-01',
          `Acceso con ID ${id} no encontrado`,
        );
      }

      // Buscamos el menu asociado al acceso
      const menu = await this.menuRepository.findOne({
        where: { id: acceso.menuId },
      });
      if (!menu) {
        return this.customThrowError(
          '',
          'AUT-64-01',
          `Menú con ID ${acceso.menuId} no encontrado`,
        );
      }

      // Verificamos si es un menu principal o un submenu
      if (menu.principal) {
        const submenus = await this.accesoRepository.find({
          where: { rolId: acceso.rolId, mainMenuId: menu.id },
        });
        // Si hay submenus, los eliminamos
        if (submenus.length > 0) {
          for (const submenu of submenus) {
            // Eliminamos el submenu
            accesoDeleted = await this.accesoRepository.softDelete({
              id: submenu.id,
            });
          }
        }
        // Eliminamos el menú principal
        accesoDeleted = await this.accesoRepository.softDelete({
          id: acceso.id,
        });
        // Reordenar el resto de menus principales
        const mainMenus = await this.accesoRepository.find({
          where: {
            rolId: acceso.rolId,
            mainMenuId: IsNull(),
            ordenMenu: MoreThan(acceso.ordenMenu || 1),
          },
          order: { ordenMenu: 'ASC' },
        });
        // Recorremos los menus y les restamos 1 al ordenMenu y guardamos
        for (const mainMenu of mainMenus) {
          mainMenu.ordenMenu = mainMenu.ordenMenu - 1;
          await this.accesoRepository.save(mainMenu);
        }
      } else {
        // Reordenar el resto de submenus
        const submenus = await this.accesoRepository.find({
          where: {
            rolId: acceso.rolId,
            mainMenuId: acceso.mainMenuId,
            ordenMenu: MoreThan(acceso.ordenMenu || 1),
          },
          order: { ordenMenu: 'ASC' },
        });
        // Recorremos los menus y les restamos 1 al ordenMenu y guardamos
        for (const submenu of submenus) {
          submenu.ordenMenu = submenu.ordenMenu - 1;
          await this.accesoRepository.save(submenu);
        }
        // Si es un submenu, eliminamos solo el submenu
        accesoDeleted = await this.accesoRepository.softDelete({
          id: acceso.id,
        });
      }

      await this.accesoRepository.remove(acceso);

      return this.customSuccessResponse(
        acceso,
        null,
        HttpStatus.OK,
        'Acceso eliminado exitosamente',
        'auth/accesos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-64', 'Error eliminando acceso');
    }
  }

  /**
   * Obtiene los accesos por rol
   * @param id ID del rol
   * @returns Objeto con el resultado de la operación
   */
  // AUT-65
  async findAccesoByRol(rolId: string) {
    try {
      const rol = await this.rolRepository.findOneBy({ id: rolId });
      if (!rol) {
        return this.customThrowError(
          '',
          'AUT-65-01',
          `Rol con ID ${rolId} no encontrado`,
        );
      }

      const accesos: any[] = [];

      const mainMenus = await this.accesoRepository.find({
        where: { rolId: rolId, mainMenuId: IsNull() },
        order: { ordenMenu: 'ASC' },
      });

      //Recorremos los accesos y buscamos los submenus
      for (const mainMenu of mainMenus) {
        const accesoTemp = {
          accesoId: mainMenu.id,
          ordenMenu: mainMenu.ordenMenu,
          showApp: mainMenu.showApp,
          showWeb: mainMenu.showWeb,
          activo: mainMenu.activo,
          menu: {},
          subMenus: [] as any[],
          menuId: mainMenu.menuId,
          rolId: rolId,
        };

        const menu = await this.menuRepository.findOne({
          where: { id: mainMenu.menuId },
        });

        if (menu) {
          accesoTemp.menu = menu || {};

          const subAccesos = await this.accesoRepository.find({
            where: { rolId: rolId, mainMenuId: mainMenu.menuId },
            order: { ordenMenu: 'ASC' },
            relations: ['menu'],
          });

          // Si hay subaccesos, los agregamos al acceso
          if (subAccesos.length > 0) {
            for (const subAcceso of subAccesos) {
              const subAccesoTemp = {
                accesoId: subAcceso.id,
                ordenMenu: subAcceso.ordenMenu,
                showApp: subAcceso.showApp,
                showWeb: subAcceso.showWeb,
                activo: subAcceso.activo,
                menu: subAcceso.menu,
                menuId: subAcceso.menuId,
                rolId: rolId,
              };
              if (subAcceso.menu) {
                accesoTemp.subMenus.push(subAccesoTemp);
              }
            }
          } else {
            // Si no hay subaccesos, aseguramos que el array esté presente
            accesoTemp.subMenus = [];
          }

          accesos.push(accesoTemp);
        }
      }

      const metadata = { total: accesos.length };
      return this.customSuccessResponse(
        accesos,
        metadata,
        HttpStatus.OK,
        'Accesos listados correctamente',
        'auth/accesos',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-65', 'Error al listar accesos por rol');
    }
  }
}
