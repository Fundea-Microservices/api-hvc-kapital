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
import { AccesosService } from './accesos.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateAccesoDto, UpdateAccesoDto } from './dto';

@ApiTags('Accesos')
@ApiBearerAuth('jwt')
@Controller('auth/accesos')
export class AccesosController {
  constructor(private readonly accesosService: AccesosService) { }

  @Post()
  @ApiOperation({
    summary: 'Crear un acceso',
    description:
      'Concede a un rol la visibilidad de un menú y define su posición dentro del listado.',
  })
  @ApiResponse({ status: 201, description: 'Acceso creado correctamente.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createAccesoDto: CreateAccesoDto) {
    return this.accesosService.create(createAccesoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar accesos',
    description: 'Devuelve los accesos de forma paginada, con filtros opcionales.',
  })
  @ApiResponse({ status: 200, description: 'Listado de accesos.' })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.accesosService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un acceso por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del acceso.' })
  @ApiResponse({ status: 200, description: 'Acceso encontrado.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un acceso con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.accesosService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un acceso' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del acceso.' })
  @ApiResponse({ status: 200, description: 'Acceso actualizado.' })
  @ApiResponse({ status: 404, description: 'No existe un acceso con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccesoDto: UpdateAccesoDto,
  ) {
    return this.accesosService.update(id, updateAccesoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un acceso' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del acceso.' })
  @ApiResponse({ status: 200, description: 'Acceso eliminado.' })
  @ApiResponse({ status: 404, description: 'No existe un acceso con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.accesosService.remove(id);
  }

  // ACCESO

  @Get(':id/rol')
  @ApiOperation({
    summary: 'Menús accesibles para un rol',
    description:
      'Devuelve el árbol de menús que puede ver el rol indicado. Es la consulta que alimenta la navegación del frontend.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del rol, no del acceso.',
  })
  @ApiResponse({ status: 200, description: 'Menús asociados al rol.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  findOneByRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.accesosService.findAccesoByRol(id);
  }
}
