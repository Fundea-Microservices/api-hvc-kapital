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
import { AccesosService } from './accesos.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateAccesoDto, UpdateAccesoDto } from './dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

@ApiTags('Accesos')
@ApiBearerAuth('jwt')
@Controller('auth/accesos')
export class AccesosController {
  constructor(private readonly accesosService: AccesosService) { }

  @Post()
  // @RequirePermissions('ACCESO_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un acceso',
    description:
      'Concede a un rol la visibilidad de un menú y define su posición dentro del listado.',
  })
  @ApiCreatedResponse({
    description: 'Acceso creado correctamente.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/accesos', timestamp: '16/09/2026 10:30:00',
        message: 'Acceso creado exitosamente',
        data: { id: 'uuid-acceso', ordenMenu: 1, showApp: true, showWeb: true, activo: true, menuId: 'uuid-menu', rolId: 'uuid-rol', created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createAccesoDto: CreateAccesoDto) {
    return this.accesosService.create(createAccesoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar accesos',
    description: 'Devuelve los accesos de forma paginada, con filtros opcionales.',
  })
  @ApiOkResponse({
    description: 'Listado de accesos.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/accesos', timestamp: '16/09/2026 10:30:00',
        message: 'Accesos listados correctamente',
        data: [
          { id: 'uuid-1', ordenMenu: 1, showApp: true, showWeb: true, activo: true, menu: { id: 'uuid-menu', label: 'Dashboard' }, rol: { id: 'uuid-rol', nombre: 'Admin' } },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.accesosService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un acceso por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del acceso.' })
  @ApiOkResponse({
    description: 'Acceso encontrado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/accesos', timestamp: '16/09/2026 10:30:00',
        message: 'Acceso encontrado',
        data: { id: 'uuid-acceso', ordenMenu: 1, showApp: true, showWeb: true, activo: true, menu: { id: 'uuid-menu', label: 'Dashboard' }, rol: { id: 'uuid-rol', nombre: 'Admin' } },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un acceso con ese id.' })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.accesosService.findOne(id);
  }

  @Put(':id')
  // @RequirePermissions('ACCESO_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({ summary: 'Actualizar un acceso' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del acceso.' })
  @ApiOkResponse({
    description: 'Acceso actualizado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/accesos', timestamp: '16/09/2026 10:30:00',
        message: 'Acceso actualizado exitosamente',
        data: { id: 'uuid-acceso', ordenMenu: 2, showApp: true, showWeb: true, activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un acceso con ese id.' })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateAccesoDto: UpdateAccesoDto,
  ) {
    return this.accesosService.update(id, updateAccesoDto);
  }

  @Delete(':id')
  @RequirePermissions('ACCESO_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({ summary: 'Eliminar un acceso' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del acceso.' })
  @ApiOkResponse({
    description: 'Acceso eliminado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/accesos', timestamp: '16/09/2026 10:30:00',
        message: 'Acceso eliminado exitosamente',
        data: { id: 'uuid-acceso', ordenMenu: 1, showApp: true, showWeb: true, activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un acceso con ese id.' })
  remove(@Param('id', ParseGuidPipe) id: string) {
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
  @ApiOkResponse({
    description: 'Menús asociados al rol.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/accesos', timestamp: '16/09/2026 10:30:00',
        message: 'Accesos listados correctamente',
        data: [
          {
            accesoId: 'uuid-acceso', ordenMenu: 1, showApp: true, showWeb: true, activo: true,
            menu: { id: 'uuid-menu', label: 'Dashboard', icono: 'home', pathWeb: '/dashboard' },
            subMenus: [
              { accesoId: 'uuid-sub', ordenMenu: 1, showApp: true, showWeb: true, activo: true, menu: { id: 'uuid-sub-menu', label: 'Reportes' } },
            ],
            menuId: 'uuid-menu', rolId: 'uuid-rol',
          },
        ],
        metadata: { total: 1 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  findOneByRol(@Param('id', ParseGuidPipe) id: string) {
    return this.accesosService.findAccesoByRol(id);
  }
}
