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
import { MenuService } from './menu.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateMenuDto, UpdateMenuDto } from './dto';

@ApiTags('Menús')
@ApiBearerAuth('jwt')
@Controller('auth/menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una entrada de menú',
    description:
      'Registra una sección de navegación. La visibilidad por rol se define después en el módulo de accesos.',
  })
  @ApiResponse({ status: 201, description: 'Menú creado correctamente.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar menús',
    description: 'Devuelve los menús de forma paginada, con filtros opcionales.',
  })
  @ApiResponse({ status: 200, description: 'Listado de menús.' })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.menuService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un menú por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del menú.' })
  @ApiResponse({ status: 200, description: 'Menú encontrado.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un menú con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una entrada de menú' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del menú.' })
  @ApiResponse({ status: 200, description: 'Menú actualizado.' })
  @ApiResponse({ status: 404, description: 'No existe un menú con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    return this.menuService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una entrada de menú' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del menú.' })
  @ApiResponse({ status: 200, description: 'Menú eliminado.' })
  @ApiResponse({ status: 404, description: 'No existe un menú con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.remove(id);
  }
}
