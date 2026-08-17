import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { GetUser, Public } from 'src/common';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida las credenciales y devuelve el token JWT con el que se autentica el resto de la API. Ruta pública.',
  })
  @ApiResponse({ status: 201, description: 'Token generado correctamente.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  @ApiResponse({ status: 401, description: 'Usuario o contraseña incorrectos.' })
  async loginUser(@Body() loginUserDto: LoginDto) {
    return await this.authService.login(loginUserDto);
  }

  @Public()
  @Post('verify-token')
  @ApiOperation({
    summary: 'Verificar un token',
    description:
      'Comprueba que un token JWT sea válido y no haya expirado. Ruta pública.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
          description: 'Token JWT que se desea verificar.',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'El token es válido.' })
  @ApiResponse({ status: 401, description: 'El token es inválido o expiró.' })
  async verifyToken(@Body('token') token: string) {
    return await this.authService.verifyToken(token);
  }

  @Get('me')
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Datos del usuario autenticado',
    description:
      'Devuelve el perfil correspondiente al token enviado en la cabecera Authorization.',
  })
  @ApiResponse({ status: 200, description: 'Usuario obtenido correctamente.' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
  async getCurrentUser(@GetUser() user: any) {
    return {
      success: true,
      statusCode: '200',
      path: 'auth/me',
      timestamp: new Date()
        .toLocaleString('es-GT', {
          timeZone: 'America/Guatemala',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        .replace(/\//g, '/')
        .replace(',', ''),
      message: 'Usuario obtenido correctamente',
      data: user,
      metadata: null,
    };
  }
}
