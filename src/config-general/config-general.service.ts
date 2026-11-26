import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { ConfigGeneral } from 'database/entities/configuracion/config-general.entity';
import { BitacoraConfigGeneral } from 'database/entities/configuracion/bitacora-config-general.entity';
import { BitacoraAutorizacion } from 'database/entities/bitacora-autorizacion.entity';
import { DominioValor } from 'database/entities/dominios/dominio-valor.entity';
import { Permiso } from 'database/entities/permisos/permiso.entity';
import { BaseService } from 'src/common';
import { AuthorizationExecutorService } from 'src/auth/usuarios/authorization-executor.service';
import { UpdateConfigGeneralDto } from './dto';
import {
  CAMPOS_FECHA_PROTEGIDA,
  CampoConfigGeneral,
  calcularDelta,
  snapshotConfigGeneral,
} from './utils/config-general.util';

const RELACIONES_CONFIG = ['casaCentralValor', 'paisValor', 'monedaValor'];

@Injectable()
export class ConfigGeneralService extends BaseService {
  protected readonly logger = new Logger(ConfigGeneralService.name);

  constructor(
    @Inject('CONFIG_GENERAL_REPOSITORY')
    private readonly configGeneralRepository: Repository<ConfigGeneral>,

    @Inject('PERMISO_REPOSITORY')
    private readonly permisoRepository: Repository<Permiso>,

    private readonly executor: AuthorizationExecutorService,
  ) {
    super();
  }

  /** Obtiene el único registro activo e incluye los DominioValor expandidos. */
  async findOne() {
    try {
      const config = await this.obtenerRegistro();

      return this.customSuccessResponse(
        config,
        null,
        HttpStatus.OK,
        'Configuración general encontrada',
        'config-general',
      );
    } catch (error) {
      this.rethrowIfCustom(error);
      this.customThrowError(
        error,
        'CFG-10',
        'Error obteniendo la configuración general',
      );
    }
  }

  /**
   * Devuelve la IP observada por el servidor para la conexión actual. Reutiliza
   * la misma extracción que `update()` para que el valor mostrado coincida con
   * el que quedará en la bitácora.
   */
  ipActual(ip: string | null) {
    return this.customSuccessResponse(
      { ip, capturadaEn: new Date().toISOString() },
      null,
      HttpStatus.OK,
      'Estación de trabajo identificada',
      'config-general/ip-actual',
    );
  }

  /**
   * Actualiza el singleton dentro de una transacción y registra el delta en la
   * bitácora. Si cambian fechas contables, exige y valida el auth_code del
   * autorizador y enlaza la BitacoraAutorizacion creada en la misma transacción.
   */
  async update(
    updateDto: UpdateConfigGeneralDto,
    usuarioId: string,
    estacionIp: string | null,
  ) {
    try {
      const actual = await this.obtenerRegistro();
      const { auth_code, justificacion, ...cambios } = updateDto;

      const deltaPrevio = calcularDelta(actual, cambios);
      const fechasProtegidas = deltaPrevio.camposModificados.filter((campo) =>
        CAMPOS_FECHA_PROTEGIDA.includes(campo),
      );

      let autorizacion: { autorizadorId: string; permisoId: string } | null =
        null;

      if (fechasProtegidas.length > 0) {
        if (!auth_code) {
          throw {
            statusCode: HttpStatus.BAD_REQUEST,
            success: false,
            message: `(CFG-13) Modificar ${fechasProtegidas.join(
              ', ',
            )} requiere el auth_code de un usuario autorizador.`,
          };
        }

        const permiso = await this.permisoRepository.findOne({
          where: { codigo: 'CONFIG_GENERAL_EDITAR' },
        });

        if (!permiso) {
          throw {
            statusCode: HttpStatus.BAD_REQUEST,
            success: false,
            message:
              '(CFG-14) No existe el permiso CONFIG_GENERAL_EDITAR para validar la autorización.',
          };
        }

        const { autorizador } = await this.executor.validarAuthCode(
          auth_code,
          permiso.id,
          usuarioId,
        );

        autorizacion = {
          autorizadorId: autorizador.id,
          permisoId: permiso.id,
        };
      }

      const bodyRequest = JSON.stringify({ ...cambios, justificacion });

      const resultado = await this.configGeneralRepository.manager.transaction(
        async (manager) => {
          const configRepo = manager.getRepository(ConfigGeneral);
          const bitacoraRepo = manager.getRepository(BitacoraConfigGeneral);

          // Bloqueo pesimista: dos ediciones simultáneas se serializan para
          // que el snapshot y el delta correspondan al mismo estado.
          const locked = await configRepo.findOne({
            where: { id: actual.id },
            lock: { mode: 'pessimistic_write' },
          });

          if (!locked) {
            throw {
              statusCode: HttpStatus.BAD_REQUEST,
              success: false,
              message: '(CFG-10) La configuración general no está registrada.',
            };
          }

          await this.validarReferenciasDominio(manager, cambios);

          const { delta, camposModificados } = calcularDelta(locked, cambios);
          const anterior = snapshotConfigGeneral(locked);

          if (
            camposModificados.some((campo) =>
              CAMPOS_FECHA_PROTEGIDA.includes(campo),
            ) &&
            !autorizacion
          ) {
            throw {
              statusCode: HttpStatus.BAD_REQUEST,
              success: false,
              message:
                '(CFG-13) Modificar fechas contables requiere el auth_code de un usuario autorizador.',
            };
          }

          let bitacoraAutorizacionId: string | null = null;

          if (autorizacion) {
            const autorizacionRepo = manager.getRepository(
              BitacoraAutorizacion,
            );
            const registro = await autorizacionRepo.save(
              autorizacionRepo.create({
                endpoint: '/config-general',
                metodo_http: 'PATCH',
                body_request: bodyRequest,
                solicitanteId: usuarioId,
                autorizadorId: autorizacion.autorizadorId,
                permisoId: autorizacion.permisoId,
              }),
            );
            bitacoraAutorizacionId = registro.id;
          }

          let guardado = locked;

          if (camposModificados.length > 0) {
            Object.assign(locked, delta);
            guardado = await configRepo.save(locked);
          }

          await bitacoraRepo.save(
            bitacoraRepo.create({
              registroId: locked.id,
              accion: 'UPDATE',
              versionAnterior: JSON.stringify(anterior),
              versionNueva: JSON.stringify(delta),
              camposModificados: JSON.stringify(camposModificados),
              justificacion,
              estacionIp,
              usuarioId,
              bitacoraAutorizacionId,
              origen: 'API',
            }),
          );

          return { guardado, camposModificados };
        },
      );

      const conRelaciones = await this.configGeneralRepository.findOne({
        where: { id: resultado.guardado.id },
        relations: RELACIONES_CONFIG,
      });

      return this.customSuccessResponse(
        conRelaciones ?? resultado.guardado,
        {
          camposModificados: resultado.camposModificados,
        },
        HttpStatus.OK,
        resultado.camposModificados.length > 0
          ? 'Configuración general actualizada correctamente'
          : 'Sin cambios de valor; el evento de auditoría fue registrado',
        'config-general',
      );
    } catch (error) {
      this.rethrowIfCustom(error);
      this.customThrowError(
        error,
        'CFG-15',
        'Error actualizando la configuración general',
      );
    }
  }

  /** Garantiza que exista exactamente un registro vivo. */
  private async obtenerRegistro(): Promise<ConfigGeneral> {
    const registros = await this.configGeneralRepository.find({
      where: { deleted_at: IsNull() },
      relations: RELACIONES_CONFIG,
      order: { created_at: 'ASC' },
    });

    if (registros.length === 0) {
      throw {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message:
          '(CFG-10) La configuración general no está registrada. Ejecute el seed institucional.',
      };
    }

    if (registros.length > 1) {
      throw {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message:
          '(CFG-11) Existe más de un registro activo de configuración general; el patrón Singleton está roto.',
      };
    }

    return registros[0];
  }

  /** Valida que cada UUID pertenezca al dominio esperado y esté activo. */
  private async validarReferenciasDominio(
    manager: EntityManager,
    cambios: Partial<Record<CampoConfigGeneral, unknown>>,
  ): Promise<void> {
    const reglas: Array<{
      campo: Extract<
        CampoConfigGeneral,
        'codigoCasaCentral' | 'pais' | 'monedaPrincipal'
      >;
      dominio: string;
    }> = [
      { campo: 'codigoCasaCentral', dominio: 'CASA_CENTRAL' },
      { campo: 'pais', dominio: 'PAIS' },
      { campo: 'monedaPrincipal', dominio: 'MONEDA' },
    ];

    for (const regla of reglas) {
      const valorId = cambios[regla.campo];
      if (valorId === undefined) continue;

      const valor = await manager.getRepository(DominioValor).findOne({
        where: { id: String(valorId), activo: true },
        relations: ['dominio'],
      });

      if (
        !valor ||
        !valor.dominio ||
        !valor.dominio.activo ||
        valor.dominio.codigo !== regla.dominio
      ) {
        throw {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: `(CFG-12) El valor enviado en ${regla.campo} no existe, está inactivo o no pertenece al dominio ${regla.dominio}.`,
        };
      }
    }
  }

  private rethrowIfCustom(error: unknown): void {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      'success' in error
    ) {
      throw error;
    }
  }
}
