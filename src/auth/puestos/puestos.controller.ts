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
  @ApiResponse({ status: 201, description: 'Puesto creado correctamente.' })
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
  @ApiResponse({ status: 200, description: 'Listado de puestos.' })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.puestosService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un puesto por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del puesto.' })
  @ApiResponse({ status: 200, description: 'Puesto encontrado.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un puesto con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.puestosService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un puesto' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del puesto.' })
  @ApiResponse({ status: 200, description: 'Puesto actualizado.' })
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
  @ApiResponse({ status: 200, description: 'Puesto eliminado.' })
  @ApiResponse({ status: 404, description: 'No existe un puesto con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.puestosService.remove(id);
  }
}
