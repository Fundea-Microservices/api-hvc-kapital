import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { Dispositivo } from 'database/entities/dispositivo.entity';
import { SesionApp } from 'database/entities/sesion-app.entity';
import { Usuario } from 'database/entities/usuario.entity';
import { BaseService } from 'src/common';

/**
 * Sesiones de la app movil sobre `app.Sesiones`.
 *
 * El access token lo emite AuthService en /auth/login; aqui se registra la
 * sesion del equipo y se gobierna su renovacion y su corte.
 */
@Injectable()
export class SesionesAppService extends BaseService {
  protected readonly logger = new Logger('SesionesAppService');

  // Vigencia del refresh token. El access token dura lo que diga TOKEN_EXPIRATION.
  private readonly DIAS_REFRESH = 30;

  constructor(
    @Inject('SESION_APP_REPOSITORY')
    private readonly sesionRepository: Repository<SesionApp>,

    @Inject('DISPOSITIVO_REPOSITORY')
    private readonly dispositivoRepository: Repository<Dispositivo>,

    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,

    private readonly jwtService: JwtService,
  ) {
    super();
  }

  /**
   * Abre la sesion del usuario en el equipo que valido el DeviceTokenGuard.
   * Sesion unica: corta las anteriores del mismo usuario antes de crear la nueva.
   */
  // SES-01
  async registrarSesion(usuario: Usuario, dispositivo: Dispositivo) {
    try {
      // El equipo se enrola a nombre de un usuario; otro no puede usarlo sin
      // volver a enrolarlo con su propio codigo.
      if (dispositivo.idUsuario !== usuario.id) {
        throw new ForbiddenException('El equipo esta enrolado a otro usuario');
      }

      await this.sesionRepository.update(
        { idUsuario: usuario.id, activa: true },
        { activa: false },
      );

      const refreshToken = randomBytes(32).toString('hex');
      const expiraEn = new Date();
      expiraEn.setDate(expiraEn.getDate() + this.DIAS_REFRESH);

      await this.sesionRepository.insert({
        idUsuario: usuario.id,
        idDispositivo: dispositivo.idDispositivo,
        refreshToken: this.hashear(refreshToken),
        fechaExpiracion: expiraEn,
        activa: true,
      });

      return this.customSuccessResponse(
        {
          refreshToken,
          expiraEn: expiraEn.toISOString(),
          requiereCambioPassword: usuario.requiereCambioPassword === true,
          tipoUsuario: usuario.tipoUsuario ?? null,
        },
        null,
        HttpStatus.CREATED,
        'Sesion registrada',
        'auth/sesion',
      );
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.customThrowError(error, 'SES-01', 'Error al registrar la sesion');
    }
  }

  /**
   * Renueva el access token y rota el refresh token.
   * Un refresh token solo sirve una vez: si llega repetido, ya no existe.
   */
  // SES-02
  async refrescar(refreshToken: string) {
    try {
      const sesion = await this.sesionRepository
        .createQueryBuilder('sesion')
        .addSelect('sesion.refreshToken')
        .where('sesion.refreshToken = :hash', {
          hash: this.hashear(refreshToken),
        })
        .andWhere('sesion.activa = :activa', { activa: true })
        .getOne();

      if (!sesion) {
        throw new UnauthorizedException('Refresh token invalido');
      }

      if (
        sesion.fechaExpiracion &&
        sesion.fechaExpiracion.getTime() < Date.now()
      ) {
        await this.sesionRepository.update(sesion.idSesion, { activa: false });
        throw new UnauthorizedException('La sesion expiro');
      }

      const dispositivo = await this.dispositivoRepository.findOne({
        where: { idDispositivo: sesion.idDispositivo },
      });

      // El mensaje exacto "Device Blocked" dispara el borrado de la base local
      // en la app: no cambiarlo sin cambiarlo tambien en apiClient.ts.
      if (!dispositivo || !dispositivo.estado) {
        await this.sesionRepository.update(sesion.idSesion, { activa: false });
        throw new ForbiddenException('Device Blocked');
      }

      const usuario = await this.usuarioRepository.findOne({
        where: { id: sesion.idUsuario, activo: true },
        relations: ['rol'],
      });

      if (!usuario || !usuario.rol?.activo) {
        await this.sesionRepository.update(sesion.idSesion, { activa: false });
        throw new UnauthorizedException('Usuario o rol inactivo');
      }

      const nuevoRefresh = randomBytes(32).toString('hex');
      const expiraEn = new Date();
      expiraEn.setDate(expiraEn.getDate() + this.DIAS_REFRESH);

      await this.sesionRepository.update(sesion.idSesion, {
        refreshToken: this.hashear(nuevoRefresh),
        fechaExpiracion: expiraEn,
      });

      // Mismo payload que AuthService.loginLocal: el AuthGuard lee userId.
      const token = this.jwtService.sign({
        userId: usuario.id,
        userName: usuario.userName,
        rolId: usuario.rol?.id,
        email: usuario.correo,
        fullName: usuario.nombreCompleto,
      });

      return this.customSuccessResponse(
        {
          token,
          refreshToken: nuevoRefresh,
          expiraEn: expiraEn.toISOString(),
          requiereCambioPassword: usuario.requiereCambioPassword === true,
          tipoUsuario: usuario.tipoUsuario ?? null,
        },
        null,
        HttpStatus.OK,
        'Token renovado',
        'auth/refresh',
      );
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.customThrowError(error, 'SES-02', 'Error al refrescar la sesion');
    }
  }

  /**
   * Cierra la sesion. Idempotente a proposito: un logout no debe fallar nunca,
   * o la app se queda con credenciales que cree validas.
   */
  // SES-03
  async cerrarSesion(refreshToken: string) {
    try {
      await this.sesionRepository
        .createQueryBuilder()
        .update(SesionApp)
        .set({ activa: false })
        .where('RefreshToken = :hash', { hash: this.hashear(refreshToken) })
        .execute();

      return this.customSuccessResponse(
        null,
        null,
        HttpStatus.OK,
        'Sesion cerrada',
        'auth/logout',
      );
    } catch (error) {
      this.customThrowError(error, 'SES-03', 'Error al cerrar la sesion');
    }
  }

  // El refresh token se guarda hasheado: una fuga de la tabla no da sesiones.
  private hashear(valor: string): string {
    return createHash('sha256').update(valor).digest('hex');
  }
}
