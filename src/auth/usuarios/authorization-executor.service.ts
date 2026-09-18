import { HttpStatus, Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { PATH_METADATA, METHOD_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { BaseService } from 'src/common';
import { Repository } from 'typeorm';
import { Usuario } from 'database/entities/usuario.entity';
import { PermisoRol } from 'database/entities/permisos/permiso-rol.entity';
import { PermisoUsuario } from 'database/entities/permisos/permiso-usuario.entity';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { BitacoraAutorizacion } from 'database/entities/bitacora-autorizacion.entity';
import { EjecutarConAutorizacionDto } from './dto';

export type EndpointHandler = (
  body: any,
  solicitanteId: string,
  params?: Record<string, string>,
) => Promise<any>;

@Injectable()
export class AuthorizationExecutorService extends BaseService implements OnApplicationBootstrap {
  protected readonly logger = new Logger('AuthorizationExecutorService');
  private readonly registry = new Map<string, EndpointHandler>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,

    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,

    @Inject('PERMISO_ROL_REPOSITORY')
    private readonly permisoRolRepository: Repository<PermisoRol>,

    @Inject('PERMISO_USUARIO_REPOSITORY')
    private readonly permisoUsuarioRepository: Repository<PermisoUsuario>,

    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,

    @Inject('BITACORA_AUTORIZACION_REPOSITORY')
    private readonly bitacoraRepository: Repository<BitacoraAutorizacion>,
  ) {
    super();
  }

  // ─── Autodescubrimiento de Rutas en el Arranque ──────────────────────────

  async onApplicationBootstrap() {
    this.autoDescubrirEndpoints();
  }

  private autoDescubrirEndpoints() {
    const controllers = this.discoveryService.getControllers();

    for (const wrapper of controllers) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      // 1. Obtener la ruta base del controlador
      const controllerPath = this.reflector.get<string>(PATH_METADATA, metatype) || '';
      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (method) => method !== 'constructor'
      );

      for (const methodName of methodNames) {
        const methodHandler = prototype[methodName];

        // 2. Verificar si el método requiere permisos
        const requierePermisos = this.reflector.get<string[]>(
          'requiredPermissions', 
          methodHandler
        );

        if (requierePermisos && requierePermisos.length > 0) {
          // 3. Extraer metadatos nativos de enrutamiento de NestJS
          const routePath = this.reflector.get<string>(PATH_METADATA, methodHandler) || '';
          const requestMethodCode = this.reflector.get<number>(METHOD_METADATA, methodHandler);

          // 4. Construir la clave en mayúsculas (ej: "POST AUTH/USUARIOS")
          const httpMethod = this.mapHttpMethod(requestMethodCode);
          const fullPath = this.limpiarRuta(`${controllerPath}/${routePath}`);
          const clave = `${httpMethod} ${fullPath}`.toUpperCase();

          // 5. Extraer metadatos de los argumentos del controlador original
          const routeArgs = Reflect.getMetadata(ROUTE_ARGS_METADATA, metatype, methodName) || {};

          // 6. Guardar en el Map la ejecución dinámica
          this.registry.set(clave, async (body: any, solicitanteId: string, params: any) => {
            const args = this.mapearArgumentosDinamicos(routeArgs, body, solicitanteId, params);
            // Delega la ejecución a la instancia real del controlador
            return methodHandler.apply(instance, args);
          });

          this.logger.log(`Endpoint Autorizable Descubierto: [${clave}] -> Permiso(s): [${requierePermisos.join(', ')}]`);
        }
      }
    }
  }

  private mapHttpMethod(methodCode: number): string {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL', 'OPTIONS', 'HEAD'];
    return methods[methodCode] || 'GET';
  }

  private limpiarRuta(ruta: string): string {
    return ruta.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
  }

  // ─── Emparejador Dinámico de Rutas ────────────────────────────────────────

  private encontrarHandler(
    metodoHttp: string, 
    endpointEnviado: string, 
    params?: Record<string, string>
  ): EndpointHandler | undefined {
    const metodo = metodoHttp.toUpperCase();
    const endpointClean = endpointEnviado.replace(/^\/|\/$/g, '').toUpperCase();
    const claveExacta = `${metodo} ${endpointClean}`;

    // 1. Búsqueda exacta (Ej. "POST AUTH/USUARIOS")
    if (this.registry.has(claveExacta)) {
      return this.registry.get(claveExacta);
    }

    // 2. Búsqueda por reconstrucción paramétrica (Ideal para tu frontend actual)
    // Frontend envía: "AUTH/USUARIOS" + params: { id: "123" } -> Busca: "AUTH/USUARIOS/:ID"
    if (params && Object.keys(params).length > 0) {
      const sufijosParams = Object.keys(params)
        .map((k) => `:${k.toUpperCase()}`)
        .join('/');
      
      const claveReconstruida = `${claveExacta}/${sufijosParams}`;
      if (this.registry.has(claveReconstruida)) {
        return this.registry.get(claveReconstruida);
      }
    }

    // 3. Búsqueda por Expresión Regular (Por si el frontend envía la URL real completa)
    // Si envían "DELETE AUTH/USUARIOS/D3F4E5A6..." -> Hace match con "DELETE AUTH/USUARIOS/:ID"
    for (const [claveRegistrada, handler] of this.registry.entries()) {
      // Reemplaza los parámetros dinámicos (:param) por un regex que acepte cualquier texto excepto '/'
      const regexString = claveRegistrada.replace(/:[^\s/]+/g, '[^/]+');
      const regex = new RegExp(`^${regexString}$`);
      
      if (regex.test(claveExacta)) {
        return handler;
      }
    }

    return undefined; // No se encontró ninguna ruta coincidente
  }

private mapearArgumentosDinamicos(
    routeArgs: any, 
    body: any, 
    solicitanteId: string, 
    params: Record<string, string>
  ): any[] {
    const args: any[] = []; // <-- Agrega : any[] aquí para evitar inferencia de type 'never[]'
    
    for (const key in routeArgs) {
      // Tipar forzosamente el objeto que se extrae de metadata
      const argDef = routeArgs[key] as { index: number; data: string | undefined };
      const { index, data } = argDef;
      
      if (key.startsWith('3')) { // @Body
        args[index] = body;
      } else if (key.startsWith('5')) { // @Param
        args[index] = data && params ? params[data] : params;
      } else {
        args[index] = undefined;
      }
    }
    return args;
  }

  getEndpointsRegistrados(): string[] {
    return Array.from(this.registry.keys());
  }

  // ─── Validación de autorización (Mantenida de tu código original) ────────

  async validarAuthCode(
    auth_code: string,
    permisoId: string,
    solicitanteId: string,
  ): Promise<{
    autorizador: Usuario;
    permiso: Permiso;
    fuenteAutorizacion: string;
  }> {
    const autorizador = await this.usuarioRepository.findOne({
      where: { auth_code: auth_code.trim() },
      relations: ['rol', 'puesto', 'sucursal'],   
    });

    if (!autorizador) {
      throw { statusCode: 400, success: false, code: 'AUTH-VAL-01', message: 'No se encontró ningún usuario con el auth_code proporcionado' };
    }

    if (!autorizador.activo) {
      throw { statusCode: 400, success: false, code: 'AUTH-VAL-02', message: 'El usuario asociado al auth_code no se encuentra activo' };
    }

    if (!autorizador.autoriza) {
      throw { statusCode: 400, success: false, code: 'AUTH-VAL-03', message: 'El usuario asociado al auth_code no tiene permisos para autorizar (autoriza = false)' };
    }

    const permiso = await this.permisoRepository.findOneBy({ id: permisoId });
    if (!permiso) {
      throw { statusCode: 400, success: false, code: 'AUTH-VAL-04', message: `Permiso con ID ${permisoId} no encontrado` };
    }

    const permisoRol = await this.permisoRolRepository.findOneBy({
      rolId: autorizador.rolId,
      permisoId,
    });

    let tieneAutorizacionPermiso = false;
    let fuenteAutorizacion: string | null = null;

    if (permisoRol?.autoriza === true) {
      tieneAutorizacionPermiso = true;
      fuenteAutorizacion = 'rol';
    } else {
      const permisoUsuario = await this.permisoUsuarioRepository.findOneBy({
        usuarioId: autorizador.id,
        permisoId,
      });

      if (permisoUsuario?.autoriza === true) {
        tieneAutorizacionPermiso = true;
        fuenteAutorizacion = 'usuario';
      }
    }

    if (!tieneAutorizacionPermiso) {
      throw {
        statusCode: 400,
        success: false,
        code: 'AUTH-VAL-05',
        message: `El usuario autorizador no tiene autorización para el permiso "${permiso.codigo}" (${permiso.modulo}/${permiso.accion}). Se requiere que su rol o su usuario tenga autoriza=true en Permiso_Rol o Permiso_Usuario.`,
      };
    }

    const solicitante = await this.usuarioRepository.findOne({
      where: { id: solicitanteId },
      relations: ['rol'],
    });

    if (!solicitante) {
      throw { statusCode: 400, success: false, code: 'AUTH-VAL-06', message: `Usuario logueado con ID ${solicitanteId} no encontrado` };
    }

    if (autorizador.id === solicitante.id) {
      throw { statusCode: 400, success: false, code: 'AUTH-VAL-07', message: 'Un usuario no puede autorizarse a sí mismo. El auth_code proporcionado pertenece al usuario logueado' };
    }

    return { autorizador, permiso, fuenteAutorizacion: fuenteAutorizacion! };
  }

  // ─── Método principal de Ejecución ───────────────────────────────────────

  async ejecutarConAutorizacion(
    dto: EjecutarConAutorizacionDto,
    solicitanteId: string,
  ) {
    try {
      const { endpoint, metodoHttp, body, params, permisoId, auth_code } = dto;

      const { autorizador, permiso, fuenteAutorizacion } = await this.validarAuthCode(
        auth_code,
        permisoId,
        solicitanteId,
      );

      const solicitante = await this.usuarioRepository.findOne({
        where: { id: solicitanteId },
        relations: ['rol'],
      });

      if (!solicitante) {
        return this.customThrowError('', 'AUT-21-04', `Usuario logueado con ID ${solicitanteId} no encontrado`);
      }

      const clave = `${metodoHttp.toUpperCase()} ${endpoint}`;
      const handler = this.encontrarHandler(metodoHttp, endpoint, params);

      if (!handler) {
        return this.customThrowError(
          '',
          'AUT-21-08',
          `El endpoint "${metodoHttp.toUpperCase()} ${endpoint}" no está registrado para ejecución con autorización. Endpoints permitidos: ${Array.from(this.registry.keys()).join(', ')}`,
        );
      }

      let resultado: any;
      try {
        resultado = await handler(body || {}, solicitanteId, params);
      } catch (execError) {
        if (execError && typeof execError === 'object' && execError.statusCode && execError.success === false) {
          throw execError;
        }
        return this.customThrowError(execError, 'AUT-21-09', `Error ejecutando el endpoint destino: ${execError?.message || execError}`);
      }

      try {
        const registro = this.bitacoraRepository.create({
          endpoint: `/${endpoint}`, // Opcional: puedes dejar solo la ruta aquí si el método ya va en su propia columna
          metodo_http: metodoHttp.toUpperCase(), // 🔴 AGREGA ESTA LÍNEA (Asegúrate de que coincida con el nombre en tu bitacora-autorizacion.entity.ts)
          body_request: JSON.stringify(body || {}),
          solicitanteId: solicitante.id,
          autorizadorId: autorizador.id,
          permisoId: permiso.id,
        });
        await this.bitacoraRepository.save(registro);
      } catch (bitacoraError) {
        this.logger.error('Error registrando en bitácora de autorización', bitacoraError?.stack || bitacoraError);
      }

      return this.customSuccessResponse(
        {
          ejecucion: resultado?.data ?? resultado,
          autorizacion: {
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
          },
        },
        null,
        HttpStatus.OK,
        'Autorización validada y operación ejecutada correctamente',
        'auth/usuarios',
      );
    } catch (error) {
      if (error && typeof error === 'object' && error.statusCode && error.success === false) {
        throw error;
      }
      this.customThrowError(error, 'AUT-21', 'Error ejecutando operación con autorización');
    }
  }
}