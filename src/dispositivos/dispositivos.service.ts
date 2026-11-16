import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Config } from 'database/entities/config.entity';
import { Dispositivo } from 'database/entities/dispositivo.entity';
import { SesionApp } from 'database/entities/sesion-app.entity';
import { Usuario } from 'database/entities/usuario.entity';
import { BaseService } from 'src/common';
import { EnrollDeviceDto, UpdateMetadataDto } from './dto';

/** Llave de auth.Config que gobierna la version minima aceptada de la app. */
const LLAVE_VERSION_MINIMA = 'VERSION_MINIMA_APP';

@Injectable()
export class DispositivosService extends BaseService {
  protected readonly logger = new Logger('DispositivosService');

  constructor(
    @Inject('DISPOSITIVO_REPOSITORY')
    private readonly dispositivoRepository: Repository<Dispositivo>,
    @Inject('SESION_APP_REPOSITORY')
    private readonly sesionRepository: Repository<SesionApp>,
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,
    @Inject('CONFIG_REPOSITORY')
    private readonly configRepository: Repository<Config>,
  ) {
    super();
  }

  // DEV-01 — Enrolamiento del equipo con el codigo de una PERSONA: el mismo
  // APK sirve a personal interno y a clientes, cada uno con su codigo.
  async enrolarEquipo(dto: EnrollDeviceDto) {
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.sucursal', 'sucursal')
      .addSelect('usuario.codigoEnrolamiento')
      .where('usuario.CodigoEnrolamiento = :codigo', {
        codigo: dto.codigoEnrolamiento,
      })
      .getOne();

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException(
        'Código de enrolamiento inválido o inactivo',
      );
    }

    // La app muestra esto como origen del equipo; la sucursal es lo mas
    // cercano a "donde opera" el usuario dueno del codigo.
    const companyName = usuario.sucursal?.nombre || 'HVC Kapital';

    const existente = await this.dispositivoRepository.findOne({
      where: { hardwareId: dto.hardwareId },
    });

    if (existente) {
      if (!existente.estado) {
        throw new UnauthorizedException(
          'Dispositivo bloqueado (Device Blocked)',
        );
      }

      // Re-enrolar con otro codigo reasigna el equipo: asi se reutiliza un
      // equipo devuelto o se traslada a otra persona.
      await this.dispositivoRepository.update(
        { idDispositivo: existente.idDispositivo },
        { idUsuario: usuario.id, fechaModificacion: new Date() },
      );

      return this.customSuccessResponse(
        { deviceToken: existente.deviceToken, companyName },
        null,
        HttpStatus.OK,
        'Equipo ya enrolado',
        'devices/enroll',
      );
    }

    const deviceToken = randomUUID();
    await this.dispositivoRepository.insert({
      hardwareId: dto.hardwareId,
      deviceToken,
      idUsuario: usuario.id,
      estado: true,
      fechaIngreso: new Date(),
      fechaModificacion: new Date(),
    });

    return this.customSuccessResponse(
      { deviceToken, companyName },
      null,
      HttpStatus.CREATED,
      'Equipo enrolado exitosamente',
      'devices/enroll',
    );
  }

  // DEV-02 — Metadatos del equipo. El dispositivo lo resolvio el guard, asi
  // que el deviceToken del cuerpo no se usa.
  async actualizarMetadatos(dispositivo: Dispositivo, dto: UpdateMetadataDto) {
    await this.dispositivoRepository.update(
      { idDispositivo: dispositivo.idDispositivo },
      {
        modelo: dto.modelo,
        versionSO: dto.versionSO,
        fechaModificacion: new Date(),
      },
    );

    return this.customSuccessResponse(
      { idDispositivo: dispositivo.idDispositivo },
      null,
      HttpStatus.OK,
      'Metadatos actualizados correctamente',
      'devices/metadata',
    );
  }

  /**
   * DEV-03 — Desvinculacion self-service desde la app (Login o Dashboard).
   *
   * No pone Estado = 0: eso bloquearia el re-enrolamiento del mismo hardware.
   * El dueno se conserva, para dejar rastro de quien tuvo el equipo.
   */
  async desvincular(dispositivo: Dispositivo) {
    await this.dispositivoRepository.update(
      { idDispositivo: dispositivo.idDispositivo },
      { fechaModificacion: new Date() },
    );
    await this.invalidarSesiones(dispositivo.idDispositivo);

    return this.customSuccessResponse(
      { idDispositivo: dispositivo.idDispositivo },
      null,
      HttpStatus.OK,
      'Dispositivo desvinculado correctamente',
      'devices/unenroll',
    );
  }

  // DEV-04 — Bloqueo administrativo desde el BackOffice (boton de panico).
  // El bloqueo de hardware manda sobre la sesion: tambien se cortan.
  async darDeBaja(deviceToken: string) {
    const dispositivo = await this.dispositivoRepository.findOne({
      where: { deviceToken },
    });

    if (!dispositivo) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    await this.dispositivoRepository.update(
      { idDispositivo: dispositivo.idDispositivo },
      { estado: false, fechaModificacion: new Date() },
    );
    await this.invalidarSesiones(dispositivo.idDispositivo);

    return this.customSuccessResponse(
      { idDispositivo: dispositivo.idDispositivo },
      null,
      HttpStatus.OK,
      'Dispositivo bloqueado exitosamente. Se ejecutará Wipe en su próxima petición.',
      'devices/block',
    );
  }

  // DEV-05 — Version minima parametrizable desde auth.Config. Si la llave no
  // existe se usa el fallback y toda version es aceptada.
  async verificarVersion(appVersion: string) {
    let versionMinima = '1.0.0';

    const parametro = await this.configRepository.findOne({
      where: { llave: LLAVE_VERSION_MINIMA, activo: true },
    });
    if (parametro?.valor?.trim()) {
      versionMinima = parametro.valor.trim();
    }

    if (this.compararVersiones(appVersion, versionMinima) < 0) {
      // Mensaje exacto que la app espera para forzar la actualizacion.
      throw new ForbiddenException('Update Required');
    }

    return this.customSuccessResponse(
      { valid: true, minVersion: versionMinima },
      null,
      HttpStatus.OK,
      'Versión compatible',
      'devices/version',
    );
  }

  /**
   * Apaga las sesiones del equipo. Best-effort a proposito: el equipo ya quedo
   * bloqueado o desvinculado y un 500 aqui lo dejaria sin poder re-enrolar.
   */
  private async invalidarSesiones(idDispositivo: number) {
    try {
      await this.sesionRepository.update(
        { idDispositivo, activa: true },
        { activa: false },
      );
    } catch (error) {
      this.logger.warn(
        `No se pudieron invalidar las sesiones del equipo ${idDispositivo}: ${
          (error as Error)?.message
        }`,
      );
    }
  }

  /** <0 si a<b, 0 si iguales, >0 si a>b. Comparar strings esta roto: "1.2" < "1.10". */
  private compararVersiones(a: string, b: string): number {
    const segA = String(a || '0')
      .split('.')
      .map((s) => parseInt(s, 10) || 0);
    const segB = String(b || '0')
      .split('.')
      .map((s) => parseInt(s, 10) || 0);
    const largo = Math.max(segA.length, segB.length);

    for (let i = 0; i < largo; i++) {
      const diff = (segA[i] || 0) - (segB[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }
}
