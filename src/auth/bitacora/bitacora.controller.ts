import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BitacoraService } from './bitacora.service';
import { CreateBitacoraDto } from './dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Bitácora de Autorización')
@ApiBearerAuth('jwt')
@Controller('auth/bitacora')
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una entrada en la bitácora',
    description:
      'Registra una solicitud de autorización. El endpoint, el body de la petición original, quién solicita, quién debe autorizar y qué permiso se requiere.',
  })
  @ApiCreatedResponse({
    description: 'Registro creado correctamente.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/bitacora', timestamp: '16/09/2026 10:30:00',
        message: 'Registro creado exitosamente',
        data: {
          id: 'uuid-bitacora', endpoint: 'POST /auth/usuarios', metodo_http: 'POST',
          body_request: '{...}', solicitanteId: 'uuid-solicitante', autorizadorId: 'uuid-autorizador',
          permisoId: 'uuid-permiso', created_at: '2026-09-16T10:30:00',
        },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  @ApiResponse({ status: 404, description: 'Solicitante, autorizador o permiso no encontrado.' })
  create(@Body() createBitacoraDto: CreateBitacoraDto) {
    return this.bitacoraService.create(createBitacoraDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar registros de bitácora',
    description:
      'Devuelve los registros de forma paginada. Admite búsqueda por endpoint, nombre de usuario o código de permiso.',
  })
  @ApiOkResponse({
    description: 'Listado de registros.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/bitacora', timestamp: '16/09/2026 10:30:00',
        message: 'Bitácora listada correctamente',
        data: [
          { id: 'uuid-1', endpoint: 'POST /auth/usuarios', metodo_http: 'POST', solicitante: { nombreCompleto: 'Juan Pérez' }, autorizador: { nombreCompleto: 'María López' }, permiso: { codigo: 'USR_CREAR' }, created_at: '2026-09-16T10:30:00' },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.bitacoraService.findAll(paginationDto);
  }

  @Get('solicitante/:solicitanteId')
  @ApiOperation({
    summary: 'Bitácora por solicitante',
    description:
      'Devuelve todos los registros de autorización solicitados por un usuario específico.',
  })
  @ApiParam({ name: 'solicitanteId', format: 'uuid', description: 'UUID del solicitante.' })
  @ApiOkResponse({
    description: 'Listado de registros del solicitante.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/bitacora', timestamp: '16/09/2026 10:30:00',
        message: 'Bitácora del solicitante listada correctamente',
        data: [
          { id: 'uuid-1', endpoint: 'POST /auth/usuarios', metodo_http: 'POST', autorizador: { nombreCompleto: 'María López' }, permiso: { codigo: 'USR_CREAR' }, created_at: '2026-09-16T10:30:00' },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  findBySolicitante(
    @Param('solicitanteId', ParseUUIDPipe) solicitanteId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bitacoraService.findBySolicitante(solicitanteId, paginationDto);
  }

  @Get('pendientes/:autorizadorId')
  @ApiOperation({
    summary: 'Registros pendientes de autorización',
    description:
      'Devuelve los registros que un autorizador específico tiene pendientes de aprobar.',
  })
  @ApiParam({ name: 'autorizadorId', format: 'uuid', description: 'UUID del autorizador.' })
  @ApiOkResponse({
    description: 'Registros pendientes listados.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/bitacora', timestamp: '16/09/2026 10:30:00',
        message: 'Registros pendientes listados correctamente',
        data: [
          { id: 'uuid-1', endpoint: 'POST /auth/usuarios', metodo_http: 'POST', solicitante: { nombreCompleto: 'Juan Pérez' }, permiso: { codigo: 'USR_CREAR' }, created_at: '2026-09-16T10:30:00' },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  findPendientes(
    @Param('autorizadorId', ParseUUIDPipe) autorizadorId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bitacoraService.findPendientes(autorizadorId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un registro de bitápor por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro.' })
  @ApiOkResponse({
    description: 'Registro encontrado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/bitacora', timestamp: '16/09/2026 10:30:00',
        message: 'Registro encontrado',
        data: {
          id: 'uuid-bitacora', endpoint: 'POST /auth/usuarios', metodo_http: 'POST',
          body_request: '{...}', solicitante: { nombreCompleto: 'Juan Pérez' },
          autorizador: { nombreCompleto: 'María López' }, permiso: { codigo: 'USR_CREAR' },
          created_at: '2026-09-16T10:30:00',
        },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un registro con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bitacoraService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions('BIT02')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar un registro de bitácora',
    description: 'Elimina un registro de la bitácora. Solo administradores.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro.' })
  @ApiOkResponse({
    description: 'Registro eliminado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/bitacora', timestamp: '16/09/2026 10:30:00',
        message: 'Registro eliminado exitosamente',
        data: { id: 'uuid-bitacora', endpoint: 'POST /auth/usuarios', metodo_http: 'POST' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Se requieren privilegios de administrador.' })
  @ApiResponse({ status: 404, description: 'No existe un registro con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bitacoraService.remove(id);
  }
}
