import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { envs } from 'src/config';
import { Repository } from 'typeorm';
import { Usuario } from 'database/entities/usuario.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      // Verificar y decodificar el token JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: envs.jwtSecret,
      });

      // Obtener el usuario completo de la base de datos
      const user = await this.usuarioRepository.findOne({
        where: { id: payload.userId, activo: true },
        relations: ['rol', 'puesto', 'sucursal'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Quitar la contraseña por seguridad
      user.clave = '';

      // Agregar el usuario completo al request
      request['user'] = user;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
