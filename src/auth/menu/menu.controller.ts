import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
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
import { MenuService } from './menu.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateMenuDto, UpdateMenuDto } from './dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

@ApiTags('Menús')
@ApiBearerAuth('jwt')
@Controller('auth/menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @RequirePermissions('MENU_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear una entrada de menú',
    description:
      'Registra una sección de navegación. La visibilidad por rol se define después en el módulo de accesos.',
  })
  @ApiCreatedResponse({
    description: 'Menú creado correctamente.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/menu', timestamp: '16/09/2026 10:30:00',
        message: 'Menú creado exitosamente',
        data: { id: 'uuid-menu', label: 'Dashboard', descripcion: 'Panel principal', pathApp: '/dashboard', pathWeb: '/dashboard', icono: 'home', color: '#000', principal: true, activo: true, created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar menús',
    description: 'Devuelve los menús de forma paginada, con filtros opcionales.',
  })
  @ApiOkResponse({
    description: 'Listado de menús.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/menu', timestamp: '16/09/2026 10:30:00',
        message: 'Menús listados correctamente',
        data: [
          { id: 'uuid-1', label: 'Dashboard', descripcion: 'Panel principal', pathApp: '/dashboard', pathWeb: '/dashboard', icono: 'home', color: '#000', principal: true, activo: true },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.menuService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un menú por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del menú.' })
  @ApiOkResponse({
    description: 'Menú encontrado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/menu', timestamp: '16/09/2026 10:30:00',
        message: 'Menú encontrado',
        data: { id: 'uuid-menu', label: 'Dashboard', descripcion: 'Panel principal', pathApp: '/dashboard', pathWeb: '/dashboard', icono: 'home', color: '#000', principal: true, activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un menú con ese id.' })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.menuService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('MENU_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({ summary: 'Actualizar una entrada de menú' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del menú.' })
  @ApiOkResponse({
    description: 'Menú actualizado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/menu', timestamp: '16/09/2026 10:30:00',
        message: 'Menú actualizado exitosamente',
        data: { id: 'uuid-menu', label: 'Dashboard', descripcion: 'Panel principal actualizado', pathApp: '/dashboard', pathWeb: '/dashboard', icono: 'home', color: '#000', principal: true, activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un menú con ese id.' })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    return this.menuService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @RequirePermissions('MENU_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({ summary: 'Eliminar una entrada de menú' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del menú.' })
  @ApiOkResponse({
    description: 'Menú eliminado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/menu', timestamp: '16/09/2026 10:30:00',
        message: 'Menú eliminado exitosamente',
        data: { id: 'uuid-menu', label: 'Dashboard', descripcion: 'Panel principal', pathApp: '/dashboard', pathWeb: '/dashboard', icono: 'home', color: '#000', principal: true, activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un menú con ese id.' })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.menuService.remove(id);
  }
}
