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
import { PuestosService } from './puestos.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreatePuestoDto, UpdatePuestoDto } from './dto';

@ApiTags('Puestos')
@ApiBearerAuth('jwt')
@Controller('auth/puestos')
export class PuestosController {
  constructor(private readonly puestosService: PuestosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un puesto',
    description: 'Registra un nuevo puesto de trabajo.',
  })
  @ApiCreatedResponse({
    description: 'Puesto creado correctamente.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/puestos', timestamp: '16/09/2026 10:30:00',
        message: 'Puesto creado exitosamente',
        data: { id: 'uuid-puesto', nombre: 'Desarrollador', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createPuestoDto: CreatePuestoDto) {
    return this.puestosService.create(createPuestoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar puestos',
    description:
      'Devuelve los puestos de forma paginada. Admite filtros por estado y búsqueda por texto.',
  })
  @ApiOkResponse({
    description: 'Listado de puestos.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/puestos', timestamp: '16/09/2026 10:30:00',
        message: 'Puestos listados correctamente',
        data: [
          { id: 'uuid-1', nombre: 'Desarrollador', activo: true },
          { id: 'uuid-2', nombre: 'Analista', activo: true },
        ],
        metadata: { total: 2, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.puestosService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un puesto por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del puesto.' })
  @ApiOkResponse({
    description: 'Puesto encontrado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/puestos', timestamp: '16/09/2026 10:30:00',
        message: 'Puesto encontrado',
        data: { id: 'uuid-puesto', nombre: 'Desarrollador', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un puesto con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.puestosService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un puesto' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del puesto.' })
  @ApiOkResponse({
    description: 'Puesto actualizado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/puestos', timestamp: '16/09/2026 10:30:00',
        message: 'Puesto actualizado exitosamente',
        data: { id: 'uuid-puesto', nombre: 'Desarrollador Senior', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un puesto con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePuestoDto: UpdatePuestoDto,
  ) {
    return this.puestosService.update(id, updatePuestoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un puesto' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del puesto.' })
  @ApiOkResponse({
    description: 'Puesto eliminado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/puestos', timestamp: '16/09/2026 10:30:00',
        message: 'Puesto eliminado exitosamente',
        data: { id: 'uuid-puesto', nombre: 'Desarrollador', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un puesto con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.puestosService.remove(id);
  }
}
