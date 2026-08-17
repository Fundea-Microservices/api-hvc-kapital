import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/common';
import { Brackets, Like, Repository } from 'typeorm';
import { Usuario } from 'database/entities/usuario.entity';
import { Rol } from 'database/entities/rol.entity';

import * as bcrypt from 'bcrypt';
import { envs } from 'src/config';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto';
import { PaginationUserDto } from './dto/pagination-user.dto';

@Injectable()
export class UsuariosService extends BaseService {
  constructor(
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,

    @Inject('ROL_REPOSITORY')
    private readonly rolRepository: Repository<Rol>,
  ) {
    super();
  }

  protected readonly logger = new Logger('UsuariosService');
  onModuleInit() {
    // this.$connect();
    this.logger.log('UsuariosService initialized');
  }

  /**
   * Crea un nuevo usuario
   * @param createUsuarioDto DTO con los datos del usuario a crear
   * @returns Objeto con el resultado de la operación
   */
  // AUT-10
  async create(createUsuarioDto: CreateUsuarioDto) {
    try {
      // Verificamos si existe el rol y el puesto
      if (createUsuarioDto.rolId) {
        const rol = await this.rolRepository.findOneBy({
          id: createUsuarioDto.rolId,
        });
        if (!rol) {
          return this.customThrowError(
            '',
            'AUT-22-01',
            `Rol con ID ${createUsuarioDto.rolId} no encontrado`,
          );
        }
      }

      const nombres =
        `${createUsuarioDto.nombre1} ${createUsuarioDto.nombre2 || ''} ${createUsuarioDto.nombre3 || ''}`.trim();
      const apellidos =
        `${createUsuarioDto.apellido1} ${createUsuarioDto.apellido2 || ''} ${createUsuarioDto.apellido3 || ''}`.trim();
      createUsuarioDto.nombreCompleto = `${nombres} ${apellidos}`.trim();

      // Si puestoId viene vacío o nulo, nos aseguramos de que no se envíe a la BD como ""
      if (!createUsuarioDto.puestoId || createUsuarioDto.puestoId.trim() === '') {
        delete createUsuarioDto.puestoId;
      }

      // Si sucursalId viene vacío o nulo, lo eliminamos
      if (!createUsuarioDto.sucursalId || createUsuarioDto.sucursalId.trim() === '') {
        delete createUsuarioDto.sucursalId;
      }

      const user = await this.usuarioRepository.create({
        ...createUsuarioDto,
        clave: bcrypt.hashSync(createUsuarioDto.clave || '', 10),
      });
      await this.usuarioRepository.save(user);

      return this.customSuccessResponse(
        user,
        null,
        HttpStatus.CREATED,
        'Usuario creado exitosamente',
        'auth/usuarios',
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
      this.customThrowError(error, 'AUT-10', 'Error creando usuario');
    }
  }

  /**
   * Obtiene todos los roles con paginación y filtros
   * @param paginationActiveDto DTO con los parámetros de paginación y filtros
   * @returns Objeto con la lista de roles y metadatos de paginación
   */
  // AUT-11
  async findAll(paginationUserDto: PaginationUserDto) {
    try {
      const { page, limit, activo, busqueda, rolId, metodoId, puestoNombre } =
        paginationUserDto;

      let customWhere = {};

      // Si se proporciona un valor para activo, lo agregamos al filtro
      if (activo !== undefined) {
        customWhere = { ...customWhere, activo: activo };
      }

      const query = this.usuarioRepository.createQueryBuilder('user');
      query.leftJoinAndSelect('user.rol', 'rol');
      // Join condicional con puesto si se requiere filtrar por nombre de puesto
      if (puestoNombre) {
        query.leftJoinAndSelect('user.puesto', 'puesto');
        query.andWhere('puesto.nombre = :puestoNombre', { puestoNombre });
      } else {
        // Cargar puesto para respuesta consistente aunque no se filtre
        query.leftJoinAndSelect('user.puesto', 'puesto');
      }
      query.leftJoinAndSelect('user.sucursal', 'sucursal');
      // query.leftJoinAndSelect('user.metodo', 'metodo');

      // Agrega condiciones AND del baseWhere dinámicamente
      Object.entries(customWhere).forEach(([key, value], index) => {
        const paramKey = `param_${key}`;
        const condition = `user.${key} = :${paramKey}`;
        if (value !== undefined) {
          if (index === 0) {
            query.where(condition, { [paramKey]: value });
          } else {
            query.andWhere(condition, { [paramKey]: value });
          }
        }
      });

      // Agrega la búsqueda OR sobre múltiples campos (si hay término de búsqueda)
      if (busqueda) {
        const likeSearch = `%${busqueda.toLowerCase()}%`;
        query.andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(user.nombre1) LIKE :busqueda', {
              busqueda: likeSearch,
            })
              .orWhere('LOWER(user.nombre2) LIKE :busqueda', {
                busqueda: likeSearch,
              })
              .orWhere('LOWER(user.nombre3) LIKE :busqueda', {
                busqueda: likeSearch,
              })
              .orWhere('LOWER(user.apellido1) LIKE :busqueda', {
                busqueda: likeSearch,
              })
              .orWhere('LOWER(user.apellido2) LIKE :busqueda', {
                busqueda: likeSearch,
              })
              .orWhere('LOWER(user.apellido3) LIKE :busqueda', {
                busqueda: likeSearch,
              })
              .orWhere('LOWER(user.userName) LIKE :busqueda', {
                busqueda: likeSearch,
              })
              .orWhere('LOWER(user.documento) LIKE :busqueda', {
                busqueda: likeSearch,
              });
          }),
        );
      }

      // Si se proporciona un rolId, filtramos por ese rol
      if (rolId) {
        query.andWhere('user.rolId = :rolId', { rolId });
      }

      // Si se proporciona un metodoId, filtramos por ese metodo
      // if (metodoId) {
      //   query.andWhere('user.metodoId = :metodoId', { metodoId });
      // }

      // Opcional: orden, paginación
      query
        .orderBy('user.nombre1', 'ASC')
        .addOrderBy('user.id', 'ASC')
        .skip((page - 1) * limit)
        .take(limit);

      const [users, total] = await query.getManyAndCount();
      const metadata = { total, page, limit };
      return this.customSuccessResponse(
        users,
        metadata,
        HttpStatus.OK,
        'Usuarios listados correctamente',
        'auth/usuarios',
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
      this.customThrowError(error, 'AUT-11', 'Error encontrando usuario');
    }
  }

  /**
   * Obtiene un usuario por su ID
   * @param id ID del usuario a buscar
   * @returns Objeto con el usuario encontrado o un error si no existe
   */
  // AUT-12
  async findOne(id: string) {
    try {
      const usuario = await this.usuarioRepository.findOneBy({ id });
      if (!usuario) {
        return this.customThrowError(
          '',
          'AUT-12-01',
          `Usuario con ID ${id} no encontrado`,
        );
      }
      return this.customSuccessResponse(
        usuario,
        null,
        HttpStatus.OK,
        'Usuario encontrado',
        'auth/usuarios',
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
      this.customThrowError(error, 'AUT-12', 'Error encontrando usuario');
    }
  }

  /**
   * Actualiza un usuario existente
   * @param updateUsuarioDto DTO con los datos del usuario a actualizar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-13
  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    try {
      // Verificar si el rol existe
      const rol = await this.rolRepository.findOneBy({
        id: updateUsuarioDto.rolId,
      });
      if (!rol) {
        return this.customThrowError(
          '',
          'AUT-13-01',
          `Rol con ID ${updateUsuarioDto.rolId} no encontrado`,
        );
      }

      // Verificar si el usuario existe
      const user = await this.usuarioRepository.findOneBy({ id });
      if (!user) {
        return this.customThrowError(
          '',
          'AUT-13-02',
          `Usuario con ID ${updateUsuarioDto.usuarioId} no encontrado`,
        );
      }

      // Actualizar los campos del usuario
      user.nombre1 = updateUsuarioDto.nombre1;
      user.nombre2 = updateUsuarioDto.nombre2 || '';
      user.nombre3 = updateUsuarioDto.nombre3 || '';
      user.apellido1 = updateUsuarioDto.apellido1;
      user.apellido2 = updateUsuarioDto.apellido2 || '';
      user.apellido3 = updateUsuarioDto.apellido3 || '';
      user.documento = updateUsuarioDto.documento;
      user.tipoDocumento = updateUsuarioDto.tipoDocumento;
      const nombres =
        `${updateUsuarioDto.nombre1} ${updateUsuarioDto.nombre2 || ''} ${updateUsuarioDto.nombre3 || ''}`.trim();
      const apellidos =
        `${updateUsuarioDto.apellido1} ${updateUsuarioDto.apellido2 || ''} ${updateUsuarioDto.apellido3 || ''}`.trim();
      user.nombreCompleto = `${nombres} ${apellidos}`.trim();
      user.correo = updateUsuarioDto.correo;
      user.userName = updateUsuarioDto.userName;
      user.rolId = updateUsuarioDto.rolId;
      user.puestoId = updateUsuarioDto.puestoId;
      user.sucursalId = updateUsuarioDto.sucursalId || undefined;
      user.lastPasswordUpdate = new Date();
      user.fotoUrl = updateUsuarioDto.fotoUrl || '';
      user.huella = updateUsuarioDto.huella;
      user.activo = updateUsuarioDto.activo || false;

      const userUpdated = await this.usuarioRepository.save(user);

      return this.customSuccessResponse(
        userUpdated,
        null,
        HttpStatus.OK,
        'Usuario actualizado',
        'auth/usuarios',
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
      this.customThrowError(error, 'AUT-13', 'Error actualizando usuario');
    }
  }

  /**
   * Elimina un usuario
   * @param id ID del usuario a eliminar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-14
  async remove(id: string) {
    try {
      // Verificar si el usuario existe
      const usuario = await this.usuarioRepository.findOneBy({ id });
      if (!usuario) {
        return this.customThrowError(
          '',
          'AUT-14-01',
          `Usuario con ID ${id} no encontrado`,
        );
      }

      await this.usuarioRepository.softDelete({ id: usuario.id });

      return this.customSuccessResponse(
        usuario,
        null,
        HttpStatus.OK,
        'Usuario eliminado exitosamente',
        'auth/usuarios',
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
      this.customThrowError(error, 'AUT-14', 'Error eliminando usuario');
    }
  }

  // AUT-15 Generar hash con bcrypt a partir de un texto
  async generarClave(valor: string) {
    try {
      if (!valor || typeof valor !== 'string') {
        return this.customThrowError(
          '',
          'AUT-15-01',
          'El parámetro "valor" es requerido',
        );
      }
      const hash = bcrypt.hashSync(valor, 10);
      return this.customSuccessResponse(
        { hash },
        null,
        HttpStatus.OK,
        'Clave generada correctamente',
        'auth/usuarios',
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
      this.customThrowError(error, 'AUT-15', 'Error generando clave');
    }
  }

  // AUT-18 Resetear contraseña de un usuario (solo admin, sin clave anterior)
  async resetClave(usuarioId: string, claveNueva: string) {
    try {
      if (!usuarioId || !claveNueva) {
        return this.customThrowError(
          '',
          'AUT-18-01',
          'usuarioId y claveNueva son requeridos',
        );
      }

      const user = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
      });
      if (!user) {
        return this.customThrowError(
          '',
          'AUT-18-02',
          `Usuario con ID ${usuarioId} no encontrado`,
        );
      }

      user.clave = bcrypt.hashSync(claveNueva, 10);
      user.lastPasswordUpdate = new Date();
      await this.usuarioRepository.save(user);

      return this.customSuccessResponse(
        { usuarioId: user.id },
        null,
        HttpStatus.OK,
        'Contraseña reseteada correctamente',
        'auth/usuarios',
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
      this.customThrowError(error, 'AUT-18', 'Error reseteando contraseña');
    }
  }

  // AUT-17 Cambiar contraseña de un usuario
  async cambiarClave(
    usuarioId: string,
    claveAnterior: string,
    claveNueva: string,
  ) {
    try {
      if (!usuarioId || !claveAnterior || !claveNueva) {
        return this.customThrowError(
          '',
          'AUT-17-01',
          'usuarioId, claveAnterior y claveNueva son requeridos',
        );
      }

      const user = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
      });
      if (!user) {
        return this.customThrowError(
          '',
          'AUT-17-02',
          `Usuario con ID ${usuarioId} no encontrado`,
        );
      }

      const coincide = bcrypt.compareSync(claveAnterior, user.clave);
      if (!coincide) {
        return this.customThrowError(
          '',
          'AUT-17-03',
          'La contraseña anterior no es correcta',
        );
      }

      user.clave = bcrypt.hashSync(claveNueva, 10);
      user.lastPasswordUpdate = new Date();
      await this.usuarioRepository.save(user);

      return this.customSuccessResponse(
        { usuarioId: user.id },
        null,
        HttpStatus.OK,
        'Contraseña actualizada',
        'auth/usuarios',
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
      this.customThrowError(error, 'AUT-17', 'Error cambiando contraseña');
    }
  }
}
