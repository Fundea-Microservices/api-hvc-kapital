import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto';
import { Repository } from 'typeorm';
import { Usuario } from 'database/entities/usuario.entity';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { BaseService } from 'src/common';

import { envs } from 'src/config/envs';

import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

import { LdapService } from './ldap.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AuthService extends BaseService {
  constructor(
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,

    private readonly jwtService: JwtService,

    private readonly ldapService: LdapService,
  ) {
    super();
  }

  protected readonly logger = new Logger('AuthService');
  onModuleInit() {
    // this.$connect();
    this.logger.log('AuthService initialized');
  }

  async signJWT(payload: any) {
    return this.jwtService.sign(payload);
  }

  /**
   * Login de usuarios
   * @param loginUserDto DTO con los datos del usuario a autenticar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-01
  async login(loginUserDto: LoginDto) {
    try {
      this.logger.log({
        label: 'AUTENTICACIÓN USUARIO',
        username: loginUserDto.userName,
        // method: metodoCode,
        date: dayjs().tz('America/Guatemala').format('DD-MM-YYYY HH:mm:ss'),
      });

      if (loginUserDto['metodoAutenticacion'] === 'Active Directory' || loginUserDto['metodoAutenticacion'] === 'ActiveDirectory') {
        return await this.loginActiveDirectory(loginUserDto);
      }


      return await this.loginLocal(loginUserDto);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        error.statusCode &&
        error.success === false
      ) {
        throw error;
      }
      this.customThrowError(error, 'AUT-01', 'Error de login');
    }
  }

  async loginLocal(loginUserDto: LoginDto) {
    try {
      const user = await this.usuarioRepository.findOne({
        where: { userName: loginUserDto.userName, activo: true },
        relations: ['rol', 'sucursal'],
      });

      if (!user) {
        return this.customThrowError('', 'AUT-01-01', 'Usuario no encontrado');
      }

      if (!user.rol || !user.rol?.activo) {
        return this.customThrowError(
          '',
          'AUT-01-02',
          'Rol de usuario inactivo o no existente',
        );
      }


      const isPasswordValid = bcrypt.compareSync(
        loginUserDto.password,
        user.clave,
      );
      
      //const isPasswordValid = true; // Temporalmente desactivado para pruebas, se debe habilitar la verificación de contraseña en producción

      if (!isPasswordValid) {
        return this.customThrowError('', 'AUT-01-03', 'Contraseña incorrecta');
      }

      //Quitamos la contraseña del objeto de usuario
      user.clave = '';

      // Generacion del token JWT
      const token = await this.signJWT({
        userId: user.id,
        userName: user.userName,
        rolId: user.rol?.id,
        email: user.correo,
        fullName: user.nombreCompleto,
      });

      return this.customSuccessResponse(
        { user, token },
        null,
        HttpStatus.OK,
        'Login successful',
        'auth/login',
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Método extra para flujo de Active Directory
   */
  private async loginActiveDirectory(loginUserDto: LoginDto) {
    try {
      // 1. Validar existencia y credenciales en Active Directory
      const ldapUserData = await this.ldapService.validateAndGetUser(
        loginUserDto.userName, 
        loginUserDto.password // O la propiedad que almacene la clave en tu LoginDto
      );

      // 2. Verificar si el usuario ya existe en la base de datos local
      let user: Usuario | null = await this.usuarioRepository.findOne({
        where: { userName: ldapUserData.username, activo: true },
        relations: ['rol', 'sucursal'],
      });

      // 3. Si no existe en local, crearlo con la información de AD
      if (!user) {
       const newUser = this.usuarioRepository.create({
          userName: ldapUserData.username,
          correo: ldapUserData.email,
          nombreCompleto: `${ldapUserData.firstName} ${ldapUserData.lastName}`.trim(),
          nombre1: ldapUserData.firstName || ldapUserData.username,
          apellido1: ldapUserData.lastName || 'AD',
          clave: '', // No requiere hash local porque se valida en AD
          activo: true,
          metodoAutenticacion: 'Active Directory',
        });
        
        const userGuardado = await this.usuarioRepository.save(newUser);

        // Volver a consultar para poblar relaciones si hay triggers o valores por defecto
        user = await this.usuarioRepository.findOne({
          where: { id: userGuardado.id },
          relations: ['rol', 'sucursal'],
        });
      } else {
        // Actualizar el correo si hubo cambios en Active Directory
        if (user.correo !== ldapUserData.email) {
          user.correo = ldapUserData.email;
          await this.usuarioRepository.save(user);
        }
      }

      if (!user || !user.rol ) {
        return this.customThrowError(
          '',
          'AUT-01-AD-01',
          'No se pudo sincronizar ni recuperar la información del usuario en la base de datos local',
        );
      }

      //NOTA: VERIFICAR ROLES Y UNIFICARLOS CON LOS ROLES DE LA BASE DE DATOS, YA QUE EL USUARIO PUEDE EXISTIR EN AD PERO NO TENER ROL ASIGNADO EN LA BASE DE DATOS
      // Verificamos estado del rol
      if (!user.rol.activo) {
        return this.customThrowError('', 'AUT-01-02', 'Rol de usuario inactivo o no existente');
      }

      // 4. Limpiar clave y generar token JWT
      user.clave = '';

      const token = await this.signJWT({
        userId: user.id,
        userName: user.userName,
        rolId: user.rol?.id,
        email: user.correo,
        fullName: user.nombreCompleto,
      });

      return this.customSuccessResponse(
        { user, token },
        null,
        HttpStatus.OK,
        'Login por Active Directory exitoso',
        'auth/login-ad',
      );
    } catch (error: any) {
      // Formatea la excepción del LDAP al estándar de tu BaseService
      return this.customThrowError(error, 'AUT-01-AD', error.message || 'Credenciales inválidas o error de Active Directory');
    }
  }

  /**
   * Verificar token válido
   * @param token string Token JWT a verificar
   * @returns Objeto con el resultado de la operación
   */
  // AUT-02
  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });

      const newToken = await this.signJWT({
        userId: user.userId,
        userName: user.userName,
        rolId: user.rolId,
        email: user.correo,
        fullName: user.nombreCompleto,
      });

      const newUser = await this.usuarioRepository.findOne({
        where: { userName: user.userName },
        relations: ['rol', 'sucursal'],
      });
      if (!newUser) {
        return this.customThrowError('', 'AUT-02-01', 'Usuario no encontrado');
      }
      //Quitamos la contraseña del objeto de usuario
      newUser.clave = '';

      return this.customSuccessResponse(
        { user: newUser, token: newToken },
        null,
        HttpStatus.OK,
        'Token verificado correctamente',
        'auth/verify-token',
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
      this.customThrowError(error, 'AUT-02', 'Error al verificar el token');
    }
  }
}
