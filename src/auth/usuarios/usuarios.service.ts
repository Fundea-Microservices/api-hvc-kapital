import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/common';
import { Brackets, FindOptionsWhere, Not, Repository } from 'typeorm';
import { Usuario } from 'database/entities/usuario.entity';
import { Rol } from 'database/entities/rol.entity';
import { PermisoRol } from 'database/entities/permisos/permiso-rol.entity';
import { PermisoUsuario } from 'database/entities/permisos/permiso-usuario.entity';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { Config } from 'database/entities/config.entity';
import * as bcrypt from 'bcrypt';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UpdateMiPerfilDto,
  ValidarAuthCodeDto,
} from './dto';
import { PaginationUserDto } from './dto/request/pagination-user.dto';
import { AuthorizationExecutorService } from './authorization-executor.service';
import { hashAuthCode } from 'src/common/crypto/hash-auth-code';

@Injectable()
export class UsuariosService extends BaseService {
  constructor(
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,

    @Inject('ROL_REPOSITORY')
    private readonly rolRepository: Repository<Rol>,

    @Inject('PERMISO_ROL_REPOSITORY')
    private readonly permisoRolRepository: Repository<PermisoRol>,

    @Inject('PERMISO_USUARIO_REPOSITORY')
    private readonly permisoUsuarioRepository: Repository<PermisoUsuario>,

    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,

    @Inject('CONFIG_REPOSITORY')
    private readonly configRepository: Repository<Config>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  protected readonly logger = new Logger('UsuariosService');

  private buildNombreCompleto(
    nombre1: string,
    nombre2: string | undefined,
    nombre3: string | undefined,
    apellido1: string,
    apellido2: string | undefined,
    apellido3: string | undefined,
  ): string {
    const nombres = `${nombre1} ${nombre2 || ''} ${nombre3 || ''}`.trim();
    const apellidos = `${apellido1} ${apellido2 || ''} ${apellido3 || ''}`.trim();
    return `${nombres} ${apellidos}`.trim();
  }

  private async resolverMetodoAutenticacion(
    metodoAutenticacion: string | undefined,
  ): Promise<string | undefined> {
    if (metodoAutenticacion !== 'Por Defecto') {
      return metodoAutenticacion;
    }

    const configMetodo = await this.configRepository.findOne({
      where: { llave: 'METODO_AUTENTICACION_DEFAULT', activo: true },
    });

    return configMetodo ? configMetodo.valor : 'Local';
  }

  private limpiarIdsOpcionales(dto: CreateUsuarioDto): void {
    if (!dto.puestoId || dto.puestoId.trim() === '') {
      delete dto.puestoId;
    }

    if (!dto.sucursalId || dto.sucursalId.trim() === '') {
      delete dto.sucursalId;
    }
  }

  private isCustomError(
    error: unknown,
  ): error is { statusCode: unknown; success: false } {
    return (
      !!error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      'success' in error &&
      !!(error as { statusCode?: unknown }).statusCode &&
      (error as { success?: unknown }).success === false
    );
  }

  private handleServiceError(error: unknown, code: string, message: string): void {
    if (this.isCustomError(error) || error instanceof HttpException) {
      throw error;
    }

    this.customThrowError(error, code, message);
  }

  /**
   * Validación preventiva de unicidad de auth_code (índice UQ_Usuario_auth_code).
   *
   * Como la entidad declaró auth_code con select: false, la comprobación se
   * hace aquí, ANTES de insertar/actualizar, para interceptar la violación de
   * la restricción de unicidad y devolver un mensaje limpio al frontend en
   * lugar del error crudo de SQL Server.
   *
   * @param authCode PIN en claro recibido del DTO. Se omite la validación si
   *                 no viene o viene vacío (auth_code es nullable en BD y solo
   *                 lo llevan los usuarios autorizadores).
   * @param messageCode Código de error del flujo invocante (AUT-22-xx en
   *                    create, AUT-13-xx en update).
   * @param usuarioExcluirId UUID del usuario que se está editando. Se excluye
   *                         de la búsqueda para no producir un falso positivo
   *                         cuando el usuario conserva su propio código.
   */
  private async verificarAuthCodeDisponible(
    authCode: string | undefined,
    messageCode: string,
    usuarioExcluirId?: string,
  ): Promise<void> {
    if (!authCode || authCode.trim() === '') {
      return;
    }

    // Mismo hash determinista (HMAC-SHA256) que se persiste en la entidad.
    const authCodeHash = hashAuthCode(authCode);

    const where: FindOptionsWhere<Usuario> = { auth_code: authCodeHash };
    if (usuarioExcluirId) {
      where.id = Not(usuarioExcluirId);
    }

    // WHERE funciona sobre columnas select: false; solo afecta al SELECT.
    const yaAsignado = await this.usuarioRepository.findOne({ where });

    if (yaAsignado) {
      return this.customThrowError(
        '',
        messageCode,
        'El código de autorización ingresado ya se encuentra asignado a otro usuario',
      );
    }
  }

  // AUT-10
  async create(createUsuarioDto: CreateUsuarioDto) {
    try {
      if (createUsuarioDto.rolId === 'Por Defecto') {
        const configRol = await this.configRepository.findOne({
          where: { llave: 'ROL_DEFAULT_ID', activo: true },
        });

        if (!configRol) {
           return this.customThrowError('', 'AUT-22-02', 'No se encontró una configuración de Rol por Defecto activa.');
        }

        console.log(`Buscando rol por defecto con ID: ${configRol.valor}`);
        const rolEncontrado = await this.rolRepository.findOneBy({
          id: configRol.valor,
        });

        if (!rolEncontrado) {
          return this.customThrowError(
            '',
            'AUT-22-03',
            `El rol por defecto "${configRol.valor}" configurado en el sistema no existe.`
          );
        }

        createUsuarioDto.rolId = rolEncontrado.id!;
      }
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

      createUsuarioDto.nombreCompleto = this.buildNombreCompleto(
        createUsuarioDto.nombre1,
        createUsuarioDto.nombre2,
        createUsuarioDto.nombre3,
        createUsuarioDto.apellido1,
        createUsuarioDto.apellido2,
        createUsuarioDto.apellido3,
      );

      this.limpiarIdsOpcionales(createUsuarioDto);
      createUsuarioDto.metodoAutenticacion = await this.resolverMetodoAutenticacion(
        createUsuarioDto.metodoAutenticacion,
      );

      // Validación preventiva de unicidad del auth_code, antes del punto de
      // autorización y de tocar la BD (UQ_Usuario_auth_code).
      // AUT-22-05 solo aplica cuando se intenta asignar un auth_code sin tener
      // permiso de autorizar: NO debe bloquear el alta de usuarios normales.
      if (createUsuarioDto.auth_code && !createUsuarioDto.autoriza) {
        return this.customThrowError(
          '',
          'AUT-22-05',
          `No se puede asignar auth_code porque el usuario no tiene permisos de autorización.`,
        );
      }

      // AUT-22-06: no se puede crear un usuario con autoriza=true sin auth_code
      // (sin código no podría autorizar acciones de otros usuarios).
      if (createUsuarioDto.autoriza && !createUsuarioDto.auth_code) {
        return this.customThrowError(
          '',
          'AUT-22-06',
          'Se requiere un auth_code para usuarios con autoriza=true.',
        );
      }

      if (createUsuarioDto.autoriza && createUsuarioDto.auth_code) {
        await this.verificarAuthCodeDisponible(
          createUsuarioDto.auth_code,
          'AUT-22-04',
        );
      }

      await this.executor.verificarPuntoDeAutorizacion();

      const { auth_code, ...usuarioData } = createUsuarioDto;

      const user = await this.usuarioRepository.create({
        ...usuarioData,
        clave: bcrypt.hashSync(createUsuarioDto.clave || '', 10),
        auth_code: auth_code ? hashAuthCode(auth_code) : undefined,
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
      this.handleServiceError(error, 'AUT-10', 'Error creando usuario');
    }
  }

  // AUT-11
  async findAll(paginationUserDto: PaginationUserDto) {
    try {
      const { page, limit, activo, busqueda, rolId, puestoNombre } =
        paginationUserDto;

      const customWhere = activo !== undefined ? { activo } : {};

      const query = this.usuarioRepository.createQueryBuilder('user');
      query.leftJoinAndSelect('user.rol', 'rol');
      query.leftJoinAndSelect('user.puesto', 'puesto');
      if (puestoNombre) {
        query.andWhere('puesto.nombre = :puestoNombre', { puestoNombre });
      }
      query.leftJoinAndSelect('user.sucursal', 'sucursal');

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

      if (rolId) {
        query.andWhere('user.rolId = :rolId', { rolId });
      }

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
      this.handleServiceError(error, 'AUT-10', 'Error creando usuario');
    }
  }

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
      this.handleServiceError(error, 'AUT-12', 'Error encontrando usuario');
    }
  }

  // AUT-13
  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    try {

      if (updateUsuarioDto.rolId === 'Por Defecto') {
        const configRol = await this.configRepository.findOne({
          where: { llave: 'ROL_DEFAULT_ID', activo: true },
        });

        if (!configRol) {
           return this.customThrowError('', 'AUT-13-03', 'No se encontró una configuración de Rol por Defecto activa.');
        }
        updateUsuarioDto.rolId = configRol.valor;
      }

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

      const user = await this.usuarioRepository.findOneBy({ id });
      if (!user) {
        return this.customThrowError(
          '',
          'AUT-13-02',
          `Usuario con ID ${updateUsuarioDto.usuarioId} no encontrado`,
        );
      }

      updateUsuarioDto.metodoAutenticacion = await this.resolverMetodoAutenticacion(
        updateUsuarioDto.metodoAutenticacion,
      );

      // Validación preventiva de unicidad del auth_code. Se excluye al usuario
      // actual (id) para no rechazar si conserva su propio código sin cambiarlo.
      // AUT-22-05 solo aplica cuando se envía un auth_code sin permiso de
      // autorizar: NO debe bloquear la edición de usuarios normales.
      if (updateUsuarioDto.auth_code && !updateUsuarioDto.autoriza) {
        return this.customThrowError(
          '',
          'AUT-22-05',
          `No se puede asignar auth_code porque el usuario no tiene permisos de autorización.`,
        );
      }

      // AUT-22-06: la transición autoriza false → true exige obligatoriamente
      // auth_code. Si el usuario YA era autorizador se permite dejarlo vacío
      // (se conserva el código ya registrado en BD).
      const eraAutorizador = user.autoriza === true;
      if (updateUsuarioDto.autoriza === true && !eraAutorizador && !updateUsuarioDto.auth_code) {
        return this.customThrowError(
          '',
          'AUT-22-06',
          'Se requiere un auth_code para otorgar permisos de autorización.',
        );
      }

      if (updateUsuarioDto.autoriza && updateUsuarioDto.auth_code) {
        await this.verificarAuthCodeDisponible(
          updateUsuarioDto.auth_code,
          'AUT-22-04',
          id,
        );
      }

      await this.executor.verificarPuntoDeAutorizacion();

      user.nombre1 = updateUsuarioDto.nombre1;
      user.nombre2 = updateUsuarioDto.nombre2 || '';
      user.nombre3 = updateUsuarioDto.nombre3 || '';
      user.apellido1 = updateUsuarioDto.apellido1;
      user.apellido2 = updateUsuarioDto.apellido2 || '';
      user.apellido3 = updateUsuarioDto.apellido3 || '';
      user.documento = updateUsuarioDto.documento;
      user.tipoDocumento = updateUsuarioDto.tipoDocumento;
      user.nombreCompleto = this.buildNombreCompleto(
        updateUsuarioDto.nombre1,
        updateUsuarioDto.nombre2,
        updateUsuarioDto.nombre3,
        updateUsuarioDto.apellido1,
        updateUsuarioDto.apellido2,
        updateUsuarioDto.apellido3,
      );
      user.correo = updateUsuarioDto.correo;
      user.userName = updateUsuarioDto.userName;
      user.rolId = updateUsuarioDto.rolId;
      user.puestoId = updateUsuarioDto.puestoId;
      user.sucursalId = updateUsuarioDto.sucursalId || undefined;
      user.lastPasswordUpdate = new Date();
      user.fotoUrl = updateUsuarioDto.fotoUrl || '';
      user.huella = updateUsuarioDto.huella;
      user.telefono = updateUsuarioDto.telefono;
      user.metodoAutenticacion = updateUsuarioDto.metodoAutenticacion;
      user.activo = updateUsuarioDto.activo || false;
      // Persistir el permiso de autorización. Antes este campo se ignoraba y el
      // guardado respondía "Usuario actualizado" sin aplicar el cambio.
      user.autoriza = updateUsuarioDto.autoriza ?? user.autoriza;
      if (updateUsuarioDto.auth_code) {
        user.auth_code = hashAuthCode(updateUsuarioDto.auth_code);
      } else if (updateUsuarioDto.autoriza === false) {
        // Regla de negocio: no puede existir auth_code si autoriza = false.
        user.auth_code = null;
      }

      const userUpdated = await this.usuarioRepository.save(user);

      return this.customSuccessResponse(
        userUpdated,
        null,
        HttpStatus.OK,
        'Usuario actualizado',
        'auth/usuarios',
      );
    } catch (error) {
      this.handleServiceError(error, 'AUT-13-01', 'Error actualizando usuario');
    }
  }

  // AUT-14
  async remove(id: string) {
    try {
      const usuario = await this.usuarioRepository.findOneBy({ id });
      if (!usuario) {
        return this.customThrowError(
          '',
          'AUT-14-01',
          `Usuario con ID ${id} no encontrado`,
        );
      }

      await this.executor.verificarPuntoDeAutorizacion();

      await this.usuarioRepository.softDelete({ id: usuario.id });

      return this.customSuccessResponse(
        usuario,
        null,
        HttpStatus.OK,
        'Usuario eliminado exitosamente',
        'auth/usuarios',
      );
    } catch (error) {
      this.handleServiceError(error, 'AUT-14-01', 'Error eliminando usuario');
    }
  }

  // AUT-15
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
      this.handleServiceError(error, 'AUT-15', 'Error creando usuario');
    }
  }

  // AUT-19
  async findOneByAuthCode(authCode: string) {
    try {
      if (!authCode || typeof authCode !== 'string' || authCode.trim() === '') {
        return this.customThrowError(
          '',
          'AUT-19-01',
          'El campo auth_code es requerido y no puede estar vacío',
        );
      }

      const usuario = await this.usuarioRepository.findOne({
        where: { auth_code: hashAuthCode(authCode) },
        relations: ['rol', 'puesto', 'sucursal'],
      });

      if (!usuario) {
        return this.customThrowError(
          '',
          'AUT-19-02',
          `No se encontró ningún usuario con el auth_code proporcionado`,
        );
      }

      if (!usuario.activo) {
        return this.customThrowError(
          '',
          'AUT-19-03',
          `El usuario asociado al auth_code no se encuentra activo`,
        );
      }

      if (!usuario.autoriza) {
        return this.customThrowError(
          '',
          'AUT-19-04',
          `El usuario asociado al auth_code no tiene permisos para autorizar (autoriza = false)`,
        );
      }

      const { clave, huella, auth_code: _authCodeHash, ...safeUser } = usuario;

      return this.customSuccessResponse(
        safeUser,
        null,
        HttpStatus.OK,
        'Usuario encontrado y validado correctamente',
        'auth/usuarios',
      );
    } catch (error) {
      this.handleServiceError(error, 'AUT-19', 'Error creando usuario');
    }
  }

  // AUT-20
  async validarAutorizacion(validarAuthCodeDto: ValidarAuthCodeDto, solicitanteId: string) {
    try {
      const { auth_code, permisoId } = validarAuthCodeDto;

      const autorizador = await this.usuarioRepository.findOne({
        where: { auth_code: hashAuthCode(auth_code) },
        relations: ['rol', 'puesto', 'sucursal'],
      });

      if (!autorizador) {
        return this.customThrowError(
          '',
          'AUT-20-01',
          `No se encontró ningún usuario con el auth_code proporcionado`,
        );
      }

      if (!autorizador.activo) {
        return this.customThrowError(
          '',
          'AUT-20-02',
          `El usuario asociado al auth_code no se encuentra activo`,
        );
      }

      if (!autorizador.autoriza) {
        return this.customThrowError(
          '',
          'AUT-20-03',
          `El usuario asociado al auth_code no tiene permisos para autorizar (autoriza = false)`,
        );
      }

      const permiso = await this.permisoRepository.findOneBy({ id: permisoId });
      if (!permiso) {
        return this.customThrowError(
          '',
          'AUT-20-06',
          `Permiso con ID ${permisoId} no encontrado`,
        );
      }

      const permisoRol = await this.permisoRolRepository.findOneBy({
        rolId: autorizador.rolId,
        permisoId,
      });

      let fuenteAutorizacion: string | null = null;

      if (permisoRol?.autoriza === true) {
        fuenteAutorizacion = 'rol';
      } else {
        const permisoUsuario = await this.permisoUsuarioRepository.findOneBy({
          usuarioId: autorizador.id,
          permisoId,
        });

        if (permisoUsuario?.autoriza === true) {
          fuenteAutorizacion = 'usuario';
        }
      }

      if (!fuenteAutorizacion) {
        return this.customThrowError(
          '',
          'AUT-20-07',
          `El usuario autorizador no tiene autorización para el permiso "${permiso.codigo}" (${permiso.modulo}/${permiso.accion}). ` +
          `Se requiere que su rol o su usuario tenga autoriza=true en la tabla Permiso_Rol o Permiso_Usuario para este permiso.`,
        );
      }

      const solicitante = await this.usuarioRepository.findOne({
        where: { id: solicitanteId },
        relations: ['rol'],
      });

      if (!solicitante) {
        return this.customThrowError(
          '',
          'AUT-20-04',
          `Usuario logueado con ID ${solicitanteId} no encontrado`,
        );
      }

      if (autorizador.id === solicitante.id) {
        return this.customThrowError(
          '',
          'AUT-20-05',
          `Un usuario no puede autorizarse a sí mismo. El auth_code proporcionado pertenece al usuario logueado`,
        );
      }

      const resultado = {
        solicitanteId: solicitante.id,
        solicitanteNombre: solicitante.nombreCompleto,
        solicitanteUsuario: solicitante.userName,
        autorizadorId: autorizador.id,
        autorizadorNombre: autorizador.nombreCompleto,
        autorizadorUsuario: autorizador.userName,
        permisoId: permiso.id,
        permisoCodigo: permiso.codigo,
        permisoModulo: permiso.modulo,
        permisoAccion: permiso.accion,
        fuenteAutorizacion,
      };

      return this.customSuccessResponse(
        resultado,
        null,
        HttpStatus.OK,
        'Autorización validada correctamente',
        'auth/usuarios',
      );
    } catch (error) {
      this.handleServiceError(error, 'AUT-20', 'Error validando autorización con auth_code');
    }
  }

  // AUT-18
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
      await this.executor.verificarPuntoDeAutorizacion();

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
      this.handleServiceError(error, 'AUT-18', 'Error reseteando contraseña');
    }
  }

  // AUT-17
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

      const user = await this.usuarioRepository.createQueryBuilder('usuario')
      .where('usuario.id = :id', { id: usuarioId })
      .addSelect('usuario.clave') 
      .getOne();

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
      this.handleServiceError(error, 'AUT-17', 'Error cambiando contraseña');
    }
  }

  // AUT-25 — Mi Perfil: el usuario autenticado actualiza sus propios datos
  // básicos. A diferencia de update(), NO valida permisos ni llama a
  // executor.verificarPuntoDeAutorizacion() (no hay autorización de un tercero)
  // y solo acepta los campos del UpdateMiPerfilDto (anti mass-assignment).
  async updateMiPerfil(usuarioId: string, dto: UpdateMiPerfilDto) {
    try {
      if (!usuarioId) {
        return this.customThrowError('', 'AUT-25-01', 'usuarioId es requerido');
      }

      const user = await this.usuarioRepository.findOneBy({ id: usuarioId });
      if (!user) {
        return this.customThrowError(
          '',
          'AUT-25-02',
          `Usuario con ID ${usuarioId} no encontrado`,
        );
      }

      // El correo es único en la entidad: validamos antes de guardar para
      // devolver un error claro en lugar de una violación de constraint.
      if (dto.correo !== undefined && dto.correo !== user.correo) {
        const correoEnUso = await this.usuarioRepository.findOneBy({
          correo: dto.correo,
        });
        if (correoEnUso && correoEnUso.id !== user.id) {
          return this.customThrowError(
            '',
            'AUT-25-03',
            `El correo "${dto.correo}" ya está en uso por otro usuario`,
          );
        }
      }

      // Solo se sobrescriben los campos enviados en el DTO (PATCH implícito).
      if (dto.nombre1 !== undefined) user.nombre1 = dto.nombre1;
      if (dto.nombre2 !== undefined) user.nombre2 = dto.nombre2;
      if (dto.nombre3 !== undefined) user.nombre3 = dto.nombre3;
      if (dto.apellido1 !== undefined) user.apellido1 = dto.apellido1;
      if (dto.apellido2 !== undefined) user.apellido2 = dto.apellido2;
      if (dto.apellido3 !== undefined) user.apellido3 = dto.apellido3;
      if (dto.correo !== undefined) user.correo = dto.correo;
      if (dto.telefono !== undefined) user.telefono = dto.telefono;

      // Misma lógica que update(): se reconstruye el nombreCompleto a partir
      // de los valores finales del usuario (existentes + actualizados).
      user.nombreCompleto = this.buildNombreCompleto(
        user.nombre1,
        user.nombre2,
        user.nombre3,
        user.apellido1,
        user.apellido2,
        user.apellido3,
      );

      const userUpdated = await this.usuarioRepository.save(user);

      return this.customSuccessResponse(
        userUpdated,
        null,
        HttpStatus.OK,
        'Mi perfil actualizado correctamente',
        'auth/usuarios',
      );
    } catch (error) {
      this.handleServiceError(error, 'AUT-25', 'Error actualizando mi perfil');
    }
  }
}
