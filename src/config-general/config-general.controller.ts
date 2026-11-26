import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { ConfigGeneralService } from './config-general.service';
import { BitacoraConfigGeneralService } from './bitacora-config-general.service';
import {
  PaginationBitacoraConfigDto,
  UpdateConfigGeneralDto,
} from './dto';
import { extraerIpCliente } from './utils/config-general.util';

const EJEMPLO_CONFIG = {
  id: 'e6a621ff-7cbd-47a5-8d4d-3538219c6756',
  codigoInterno: 'HVC-CORP-001',
  nombreComercial: 'HVC Kapital Sociedad Anónima',
  codigoCasaCentral: '6d86227b-027d-4ca0-a8e5-f1826fe4a66c',
  pais: '5d6c59c0-1f45-4688-9a74-21df77686628',
  monedaPrincipal: 'f8128526-21b7-46f2-898f-80680b6b6f96',
  fechaCierre: '2026-11-23',
  fechaApertura: '2026-11-24',
  cierreMensual: '2026-10-31',
  nit: '7845129-3',
  codigoSIB: 'SIB-PENDIENTE',
  registroMercadoValores: 'RMV-PENDIENTE',
  representanteLegal: 'Representante Legal Pendiente',
  dpiRepresentante: '0000000000000',
  direccionFiscal: 'Ciudad de Guatemala, Guatemala',
  horaInicioOp: '08:30',
  horaCierreOp: '17:00',
  activo: true,
};

@ApiTags('Configuración General')
@ApiBearerAuth('jwt')
@Controller('config-general')
export class ConfigGeneralController {
  constructor(
    private readonly configGeneralService: ConfigGeneralService,
    private readonly bitacoraService: BitacoraConfigGeneralService,
  ) {}

  @Get()
  @RequirePermissions('CONFIG_GENERAL_LEER')
  @ApiOperation({
    summary: 'Consultar la configuración general institucional',
    description:
      'Devuelve el único registro de ConfigGeneral con `codigoCasaCentral`, `pais` y `monedaPrincipal` expandidos desde DominioValor.',
  })
  @ApiOkResponse({
    description: 'Configuración general encontrada.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config-general',
        timestamp: '24/11/2026 11:30:00',
        message: 'Configuración general encontrada',
        data: EJEMPLO_CONFIG,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'CFG-10: no existe el registro. CFG-11: existe más de un registro activo.',
  })
  findOne() {
    return this.configGeneralService.findOne();
  }

  @Get('bitacora')
  @RequirePermissions('BITACORA_CONFIG_LEER')
  @ApiOperation({
    summary: 'Consultar la bitácora inmutable de configuración general',
    description:
      'Listado paginado y de solo lectura, ordenado por `created_at DESC`. Admite filtros por usuario, acción, origen, rango de fechas y campo modificado. No existen endpoints POST, PATCH ni DELETE sobre esta bitácora.',
  })
  @ApiOkResponse({
    description: 'Bitácora listada correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config-general/bitacora',
        timestamp: '24/11/2026 11:30:00',
        message: 'Bitácora de configuración listada correctamente',
        data: [
          {
            id: '0273877e-16cc-4a56-ad10-416d9e1553a0',
            registroId: 'e6a621ff-7cbd-47a5-8d4d-3538219c6756',
            accion: 'INSERT',
            versionAnterior: null,
            versionNueva: { codigoInterno: 'HVC-CORP-001' },
            camposModificados: ['codigoInterno'],
            justificacion: 'Registro institucional inicial creado por el seed.',
            estacionIp: null,
            usuario: null,
            origen: 'MIGRACION_SEED',
            created_at: '2026-11-24T11:30:00.000Z',
          },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findBitacora(@Query() paginationDto: PaginationBitacoraConfigDto) {
    return this.bitacoraService.findAll(paginationDto);
  }

  @Get('ip-actual')
  @RequirePermissions('CONFIG_GENERAL_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Consultar la IP observada de la conexión actual',
    description:
      'Devuelve la dirección IP que el servidor observa para la petición autenticada. Es el mismo valor que se persiste en `estacionIp` al guardar la configuración. La IP puede ser `null` si no se pudo resolver.',
  })
  @ApiOkResponse({
    description: 'IP de la conexión actual.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config-general/ip-actual',
        timestamp: '26/11/2026 09:15:00',
        message: 'Estación de trabajo identificada',
        data: {
          ip: '190.85.12.34',
          capturadaEn: '2026-11-26T15:15:00.000Z',
        },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'El usuario no es administrador o no tiene CONFIG_GENERAL_EDITAR.',
  })
  ipActual(@Req() request: Request) {
    return this.configGeneralService.ipActual(extraerIpCliente(request));
  }

  @Patch()
  @RequirePermissions('CONFIG_GENERAL_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar la configuración general institucional',
    description:
      'Actualización parcial del singleton. `justificacion` es obligatoria. Si se modifican `fechaCierre`, `fechaApertura` o `cierreMensual`, se exige `auth_code` de un supervisor autorizado; la autorización y el evento de auditoría se guardan en la misma transacción.',
  })
  @ApiOkResponse({ description: 'Configuración general actualizada.' })
  @ApiResponse({
    status: 400,
    description:
      'CFG-10: no existe el registro. CFG-12: UUID de dominio inválido. CFG-13: falta auth_code para fechas. CFG-14: permiso no encontrado. AUTH-VAL-*: auth_code inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'El usuario no es administrador o no tiene CONFIG_GENERAL_EDITAR.',
  })
  update(
    @Body() updateDto: UpdateConfigGeneralDto,
    @GetUser('id') usuarioId: string,
    @Req() request: Request,
  ) {
    return this.configGeneralService.update(
      updateDto,
      usuarioId,
      extraerIpCliente(request),
    );
  }
}
