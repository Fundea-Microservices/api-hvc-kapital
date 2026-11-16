import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Dispositivo } from 'database/entities/dispositivo.entity';
import { Usuario } from 'database/entities/usuario.entity';
import { GetDispositivo, GetUser, Public } from 'src/common';
import { DeviceTokenGuard } from 'src/common/guards/device-token.guard';
import { RefreshTokenDto, RefrescoResponseDto, SesionResponseDto } from './dto';
import { SesionesAppService } from './sesiones-app.service';

/**
 * Sesiones de la app movil. Cuelgan de /auth porque es el prefijo que ya usa
 * la app; el login en si lo sigue sirviendo AuthController.
 */
@ApiTags('Sesiones de la app')
@Controller('auth')
export class SesionesAppController {
  constructor(private readonly sesionesAppService: SesionesAppService) {}

  @Post('sesion')
  @UseGuards(DeviceTokenGuard)
  @ApiBearerAuth('jwt')
  @ApiHeader({
    name: 'x-device-token',
    description: 'Token del equipo enrolado.',
  })
  @ApiOperation({
    summary: 'Registra la sesion del equipo y entrega el refresh token.',
    description:
      'Se llama justo despues de /auth/login. Corta las sesiones anteriores ' +
      'del usuario: solo una queda activa.',
  })
  @ApiResponse({ status: 201, type: SesionResponseDto })
  @ApiResponse({
    status: 403,
    description: 'El equipo esta enrolado a otro usuario.',
  })
  async registrarSesion(
    @GetUser() usuario: Usuario,
    @GetDispositivo() dispositivo: Dispositivo,
  ) {
    return this.sesionesAppService.registrarSesion(usuario, dispositivo);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renueva el access token.',
    description:
      'Publica porque el access token ya vencio. Rota el refresh token: el ' +
      'anterior queda inservible.',
  })
  @ApiResponse({ status: 200, type: RefrescoResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalido o expirado.',
  })
  async refrescar(@Body() dto: RefreshTokenDto) {
    return this.sesionesAppService.refrescar(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cierra la sesion del equipo.',
    description:
      'Responde 200 aunque el token ya no exista: el logout no debe fallar.',
  })
  async cerrarSesion(@Body() dto: RefreshTokenDto) {
    return this.sesionesAppService.cerrarSesion(dto.refreshToken);
  }
}
