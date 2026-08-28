import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BaseService } from 'src/common';
import { Repository } from 'typeorm';
import { Usuario } from 'database/entities/usuario.entity';
import { PermisoRol } from 'database/entities/permisos/permiso-rol.entity';
import { PermisoUsuario } from 'database/entities/permisos/permiso-usuario.entity';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { BitacoraAutorizacion } from 'database/entities/bitacora-autorizacion.entity';
import { EjecutarConAutorizacionDto } from './dto';

/**
 * Tipo de función que ejecuta un endpoint.
 * Recibe (body, solicitanteId, params?) y retorna la respuesta formateada.
 */
export type EndpointHandler = (
  body: any,
  solicitanteId: string,
  params?: Record<string, string>,
) => Promise<any>;

/**
 * Servicio que orquesta la autorización y ejecución de endpoints.
 *
 * En vez de hacer llamadas HTTP internas, llama directamente al método
 * del service correspondiente, eliminando overhead de red, doble parseo
 * de JWT y dependencia de puerto/configuración.
 *
 * ## Cómo registrar endpoints
 *
 * Cada service que quiera exponer endpoints autorizables debe llamar
 * a `registrarEndpoint()` en su propio `onModuleInit()`:
 *
 * ```typescript
 * @Injectable()
 * export class ProductosService implements OnModuleInit {
 *   constructor(private readonly executor: AuthorizationExecutorService) {}
 *
 *   onModuleInit() {
 *     this.executor.registrarEndpoint('POST PRODUCTOS', (body, userId) =>
 *       this.crear(body),
 *     );
 *     this.executor.registrarEndpoint('DELETE PRODUCTOS/:ID', (body, userId, params) =>
 *       this.eliminar(params.id),
 *     );
 *   }
 * }
 * ```
 *
 * ## Flujo
 * 1. Cada service registra sus handlers en onModuleInit
 * 2. Al recibir petición: valida auth_code, permisos, auto-autorización
 * 3. Busca el handler en el registry
 * 4. Ejecuta el handler directamente (llamada al service)
 * 5. Registra en bitácora
 * 6. Retorna resultado + auditoría
 */
@Injectable()
export class AuthorizationExecutorService extends BaseService {
  protected readonly logger = new Logger('AuthorizationExecutorService');

  /**
   * Registry de endpoints permitidos.
   * Key: "METODO RUTA" normalizado (ej: "POST AUTH/USUARIOS", "DELETE AUTH/USUARIOS/:ID")
   * Value: función que ejecuta la operación
   *
   * Para agregar un nuevo endpoint autorizable, llama a registrarEndpoint()
   * desde el onModuleInit() del service que lo implementa.
   */
  private readonly registry = new Map<string, EndpointHandler>();

  constructor(
    // ─── Repositorios para validación de autorización ──────────────────────
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

  // ─── Registro de endpoints ───────────────────────────────────────────────

  /**
   * Registra un endpoint que puede ejecutarse con autorización.
   * Llamar desde el onModuleInit() de cada service.
   *
   * @param clave  "METODO RUTA" (ej: "POST AUTH/USUARIOS", "DELETE PRODUCTOS/:ID")
   * @param handler Función (body, solicitanteId, params?) => Promise<resultado>
   *
   * @example
   * // En ProductosService.onModuleInit():
   * this.executor.registrarEndpoint('POST PRODUCTOS', (body, userId) =>
   *   this.crear(body),
   * );
   * this.executor.registrarEndpoint('DELETE PRODUCTOS/:ID', (body, userId, params) =>
   *   this.eliminar(params.id),
   * );
   */
  registrarEndpoint(clave: string, handler: EndpointHandler): void {
    const key = clave.toUpperCase();
    this.registry.set(key, handler);
    this.logger.log(`Endpoint autorizable registrado: [${key}]`);
  }

  /**
   * Retorna la lista de endpoints registrados (para debugging/logging).
   */
  getEndpointsRegistrados(): string[] {
    return Array.from(this.registry.keys());
  }

  // ─── Método principal ────────────────────────────────────────────────────

  /**
   * Valida autorización y ejecuta el endpoint en un solo paso.
   *
   * @param dto Datos de la petición + auth_code + permisoId + params
   * @param solicitanteId UUID del usuario logueado (del JWT)
   * @returns Resultado de la ejecución + datos de auditoría
   */
  // AUT-21
  async ejecutarConAutorizacion(
    dto: EjecutarConAutorizacionDto,
    solicitanteId: string,
  ) {
    try {
      const { endpoint, metodoHttp, body, params, permisoId, auth_code } = dto;

      // ─── FASE 1: Validaciones ──────────────────────────────────────────

      // 1. Buscar el usuario autorizador por auth_code
      const autorizador = await this.usuarioRepository.findOne({
        where: { auth_code: auth_code.trim() },
        relations: ['rol', 'puesto', 'sucursal'],
      });

      if (!autorizador) {
        return this.customThrowError(
          '',
          'AUT-21-01',
          `No se encontró ningún usuario con el auth_code proporcionado`,
        );
      }

      // 2. Validar que el usuario autorizador esté activo
      if (!autorizador.activo) {
        return this.customThrowError(
          '',
          'AUT-21-02',
          `El usuario asociado al auth_code no se encuentra activo`,
        );
      }

      // 3. Validar que el usuario autorizador tenga permisos generales para autorizar
      if (!autorizador.autoriza) {
        return this.customThrowError(
          '',
          'AUT-21-03',
          `El usuario asociado al auth_code no tiene permisos para autorizar (autoriza = false)`,
        );
      }

      // 4. Validar que el permiso existe
      const permiso = await this.permisoRepository.findOneBy({ id: permisoId });
      if (!permiso) {
        return this.customThrowError(
          '',
          'AUT-21-06',
          `Permiso con ID ${permisoId} no encontrado`,
        );
      }

      // 5. Validar autorización específica del permiso:
      //    Verificar Permiso_Rol: ¿el rol del autorizador tiene autoriza=true para este permiso?
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
        // 6. Verificar Permiso_Usuario: ¿el autorizador tiene autoriza=true directamente?
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
        return this.customThrowError(
          '',
          'AUT-21-07',
          `El usuario autorizador no tiene autorización para el permiso \"${permiso.codigo}\" (${permiso.modulo}/${permiso.accion}). ` +
          `Se requiere que su rol o su usuario tenga autoriza=true en la tabla Permiso_Rol o Permiso_Usuario para este permiso.`,
        );
      }

      // 7. Obtener el usuario logueado (solicitante)
      const solicitante = await this.usuarioRepository.findOne({
        where: { id: solicitanteId },
        relations: ['rol'],
      });

      if (!solicitante) {
        return this.customThrowError(
          '',
          'AUT-21-04',
          `Usuario logueado con ID ${solicitanteId} no encontrado`,
        );
      }

      // 8. Validación de auto-autorización:
      // Si el solicitante es admin y tiene auth_code propio, no puede usar el suyo
      if (
        solicitante.rol?.esAdmin &&
        solicitante.auth_code &&
        solicitante.auth_code.trim() === auth_code.trim()
      ) {
        return this.customThrowError(
          '',
          'AUT-21-05',
          `Un administrador no puede autorizarse a sí mismo. El auth_code proporcionado coincide con el propio del usuario logueado`,
        );
      }

      // ─── FASE 2: Ejecución directa del endpoint ────────────────────────

      const clave = `${metodoHttp.toUpperCase()} ${endpoint}`;
      const handler = this.registry.get(clave);

      if (!handler) {
        return this.customThrowError(
          '',
          'AUT-21-08',
          `El endpoint \"${metodoHttp.toUpperCase()} ${endpoint}\" no está registrado para ejecución con autorización. ` +
          `Endpoints permitidos: ${Array.from(this.registry.keys()).join(', ')}`,
        );
      }

      let resultado: any;
      try {
        resultado = await handler(body || {}, solicitanteId, params);
      } catch (execError) {
        // Si el endpoint destino lanza un error, lo propagamos con contexto
        if (
          execError &&
          typeof execError === 'object' &&
          execError.statusCode &&
          execError.success === false
        ) {
          throw execError;
        }
        return this.customThrowError(
          execError,
          'AUT-21-09',
          `Error ejecutando el endpoint destino: ${execError?.message || execError}`,
        );
      }

      // ─── FASE 3: Registro en bitácora ──────────────────────────────────

      try {
        const registro = this.bitacoraRepository.create({
          endpoint: `${metodoHttp.toUpperCase()} /${endpoint}`,
          body_request: JSON.stringify(body || {}),
          solicitanteId: solicitante.id,
          autorizadorId: autorizador.id,
          permisoId: permiso.id,
        });
        await this.bitacoraRepository.save(registro);
      } catch (bitacoraError) {
        // Si falla la bitácora, logueamos pero no fallamos la operación
        this.logger.error(
          'Error registrando en bitácora de autorización',
          bitacoraError?.stack || bitacoraError,
        );
      }

      // ─── FASE 4: Retorno ───────────────────────────────────────────────

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
      if (
        error &&
        typeof error === 'object' &&
        error.statusCode &&
        error.success === false
      ) {
        throw error;
      }
      this.customThrowError(error, 'AUT-21', 'Error ejecutando operación con autorización');
    }
  }
}
