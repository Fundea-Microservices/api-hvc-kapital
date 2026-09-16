import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
  Query,
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
import { ApiKeysService } from './api-keys.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateApikeyDto, UpdateApikeyDto } from './dto';

@ApiTags('Llaves de API')
@ApiBearerAuth('jwt')
@Controller('auth/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una llave de API',
    description:
      'Da de alta una llave para que un sistema externo consuma la API sin usuario interactivo.',
  })
  @ApiCreatedResponse({
    description: 'Llave creada correctamente. El valor (hex) NO se devuelve por seguridad.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/api-keys', timestamp: '16/09/2026 10:30:00',
        message: 'API Key creada exitosamente',
        data: { id: 'uuid-key', nombre: 'Sistema Externo', descripcion: 'Llave para integración', activo: true, created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createApikeyDto: CreateApikeyDto) {
    return this.apiKeysService.create(createApikeyDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar llaves de API',
    description: 'Devuelve las llaves registradas de forma paginada.',
  })
  @ApiOkResponse({
    description: 'Listado de llaves. El campo valor (hex) NO se incluye por seguridad.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/api-keys', timestamp: '16/09/2026 10:30:00',
        message: 'API Keys listadas correctamente',
        data: [
          { id: 'uuid-1', nombre: 'Sistema Externo', descripcion: 'Llave para integración', activo: true },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.apiKeysService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una llave por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la llave.' })
  @ApiOkResponse({
    description: 'Llave encontrada. El campo valor (hex) NO se incluye por seguridad.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/api-keys', timestamp: '16/09/2026 10:30:00',
        message: 'API Key encontrada',
        data: { id: 'uuid-key', nombre: 'Sistema Externo', descripcion: 'Llave para integración', activo: true, created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe una llave con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una llave de API' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la llave.' })
  @ApiOkResponse({
    description: 'Llave actualizada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/api-keys', timestamp: '16/09/2026 10:30:00',
        message: 'API Key actualizada exitosamente',
        data: { id: 'uuid-key', nombre: 'Sistema Externo v2', descripcion: 'Llave actualizada', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe una llave con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApikeyDto: UpdateApikeyDto,
  ) {
    return this.apiKeysService.update(id, updateApikeyDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una llave de API',
    description: 'Revoca la llave: los sistemas que la usen dejarán de autenticarse.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la llave.' })
  @ApiOkResponse({
    description: 'Llave eliminada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/api-keys', timestamp: '16/09/2026 10:30:00',
        message: 'API Key eliminada exitosamente',
        data: { id: 'uuid-key', nombre: 'Sistema Externo', descripcion: 'Llave para integración', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe una llave con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.remove(id);
  }
}
