import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Dispositivo } from 'database/entities/dispositivo.entity';
import { Public } from 'src/common';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { GetDispositivo } from 'src/common/decorators/get-dispositivo.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { DeviceTokenGuard } from 'src/common/guards/device-token.guard';
import { DispositivosService } from './dispositivos.service';
import {
  CheckVersionDto,
  CheckVersionResponseDto,
  DispositivoResponseDto,
  EnrollDeviceDto,
  EnrollResponseDto,
  UpdateMetadataDto,
} from './dto';

/**
 * Equipos moviles enrolados (esquema `app`).
 *
 * Rutas de la app: se autorizan con el x-device-token del equipo, no con JWT,
 * porque ocurren antes de que exista sesion de usuario.
 */
@ApiTags('Dispositivos')
@Controller('devices')
export class DispositivosController {
  constructor(private readonly dispositivosService: DispositivosService) {}

  @Public()
  @Post('enroll')
  @ApiOperation({
    summary: 'Enrolar un equipo',
    description:
      'Vincula el equipo al usuario dueno del codigo de enrolamiento y devuelve ' +
      'el deviceToken con el que la app se identificara. Ruta publica.',
  })
  @ApiOkResponse({
    type: EnrollResponseDto,
    description: 'Equipo enrolado o ya enrolado.',
  })
  @ApiResponse({
    status: 401,
    description: 'Codigo invalido, inactivo o equipo bloqueado.',
  })
  async enrolar(@Body() dto: EnrollDeviceDto) {
    return await this.dispositivosService.enrolarEquipo(dto);
  }

  @Public()
  @UseGuards(DeviceTokenGuard)
  @Put('metadata')
  @ApiHeader({
    name: 'x-device-token',
    required: true,
    description: 'Token del equipo enrolado.',
  })
  @ApiOperation({
    summary: 'Actualizar los metadatos del equipo',
    description:
      'Guarda modelo y version de SO del equipo identificado por su deviceToken.',
  })
  @ApiOkResponse({
    type: DispositivoResponseDto,
    description: 'Metadatos actualizados.',
  })
  @ApiResponse({
    status: 403,
    description: 'Dispositivo no registrado o bloqueado.',
  })
  async actualizarMetadatos(
    @GetDispositivo() dispositivo: Dispositivo,
    @Body() dto: UpdateMetadataDto,
  ) {
    return await this.dispositivosService.actualizarMetadatos(dispositivo, dto);
  }

  @Public()
  @UseGuards(DeviceTokenGuard)
  @Post('unenroll')
  @ApiHeader({
    name: 'x-device-token',
    required: true,
    description: 'Token del equipo enrolado.',
  })
  @ApiOperation({
    summary: 'Desvincular el equipo (self-service)',
    description:
      'Corta las sesiones del equipo sin bloquearlo, para que el mismo hardware ' +
      'pueda volver a enrolarse. Se autoriza por posesion del deviceToken.',
  })
  @ApiOkResponse({
    type: DispositivoResponseDto,
    description: 'Equipo desvinculado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Dispositivo no registrado o bloqueado.',
  })
  async desvincular(@GetDispositivo() dispositivo: Dispositivo) {
    return await this.dispositivosService.desvincular(dispositivo);
  }

  @Public()
  @Get('version')
  @ApiOperation({
    summary: 'Validar la version de la app',
    description:
      'Compara la version instalada contra VERSION_MINIMA_APP (auth.Config). ' +
      'Responde 403 "Update Required" si es obsoleta. Ruta publica.',
  })
  @ApiOkResponse({
    type: CheckVersionResponseDto,
    description: 'Version compatible.',
  })
  @ApiResponse({
    status: 403,
    description: 'Update Required: la app debe actualizarse.',
  })
  async verificarVersion(@Query() query: CheckVersionDto) {
    return await this.dispositivosService.verificarVersion(query.appVersion);
  }

  // Boton de panico del BackOffice: a diferencia del resto, exige JWT de un
  // usuario con rol administrador.
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  @Patch('block/:token')
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Bloquear un equipo',
    description:
      'Bloqueo administrativo del equipo (Estado = 0) y corte de sus sesiones. ' +
      'La app borra su base local en la siguiente peticion. Solo administradores.',
  })
  @ApiOkResponse({
    type: DispositivoResponseDto,
    description: 'Equipo bloqueado.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un equipo con ese deviceToken.',
  })
  async bloquear(@Param('token') token: string) {
    return await this.dispositivosService.darDeBaja(token);
  }
}
