import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BitacoraService } from './bitacora.service';
import { CreateBitacoraDto } from './dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';

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
  @ApiResponse({ status: 201, description: 'Registro creado correctamente.' })
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
  @ApiResponse({ status: 200, description: 'Listado de registros.' })
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
  @ApiResponse({ status: 200, description: 'Listado de registros del solicitante.' })
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
  @ApiResponse({ status: 200, description: 'Registros pendientes listados.' })
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
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un registro con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bitacoraService.findOne(id);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({
    summary: 'Eliminar un registro de bitácora',
    description: 'Elimina un registro de la bitácora. Solo administradores.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del registro.' })
  @ApiResponse({ status: 200, description: 'Registro eliminado.' })
  @ApiResponse({ status: 403, description: 'Se requieren privilegios de administrador.' })
  @ApiResponse({ status: 404, description: 'No existe un registro con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bitacoraService.remove(id);
  }
}
