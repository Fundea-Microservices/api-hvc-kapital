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
import { SucursalService } from './sucursal.service';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Sucursales')
@ApiBearerAuth('jwt')
@Controller('auth/sucursal')
export class SucursalController {
  constructor(private readonly sucursalService: SucursalService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una sucursal',
    description: 'Registra una nueva sucursal de la organización.',
  })
  @ApiResponse({ status: 201, description: 'Sucursal creada correctamente.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createDto: CreateSucursalDto) {
    return this.sucursalService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar sucursales',
    description: 'Devuelve las sucursales de forma paginada.',
  })
  @ApiResponse({ status: 200, description: 'Listado de sucursales.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.sucursalService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una sucursal por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la sucursal.' })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe una sucursal con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sucursalService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una sucursal' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la sucursal.' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada.' })
  @ApiResponse({ status: 404, description: 'No existe una sucursal con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSucursalDto,
  ) {
    return this.sucursalService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una sucursal' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la sucursal.' })
  @ApiResponse({ status: 200, description: 'Sucursal eliminada.' })
  @ApiResponse({ status: 404, description: 'No existe una sucursal con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sucursalService.remove(id);
  }
}
