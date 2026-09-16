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
import { RolesService } from './roles.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateRolDto, UpdateRolDto } from './dto';

@ApiTags('Roles')
@ApiBearerAuth('jwt')
@Controller('auth/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un rol',
    description:
      'Registra un rol nuevo. Los permisos se asignan aparte, desde el módulo de permisos.',
  })
  @ApiCreatedResponse({
    description: 'Rol creado correctamente.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/roles', timestamp: '16/09/2026 10:30:00',
        message: 'Rol creado exitosamente',
        data: { id: 'uuid-rol', nombre: 'Administrador', invitado: false, activo: true, esAdmin: true, created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createRoleDto: CreateRolDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar roles',
    description:
      'Devuelve los roles de forma paginada. Admite filtros por estado y búsqueda por texto.',
  })
  @ApiOkResponse({
    description: 'Listado de roles.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/roles', timestamp: '16/09/2026 10:30:00',
        message: 'Roles listados correctamente',
        data: [
          { id: 'uuid-rol-1', nombre: 'Administrador', invitado: false, activo: true, esAdmin: true },
          { id: 'uuid-rol-2', nombre: 'Operador', invitado: false, activo: true, esAdmin: false },
        ],
        metadata: { total: 2, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.rolesService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un rol por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del rol.' })
  @ApiOkResponse({
    description: 'Rol encontrado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/roles', timestamp: '16/09/2026 10:30:00',
        message: 'Rol encontrado',
        data: { id: 'uuid-rol', nombre: 'Administrador', invitado: false, activo: true, esAdmin: true, created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un rol con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del rol.' })
  @ApiOkResponse({
    description: 'Rol actualizado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/roles', timestamp: '16/09/2026 10:30:00',
        message: 'Rol actualizado exitosamente',
        data: { id: 'uuid-rol', nombre: 'Administrador', invitado: false, activo: true, esAdmin: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un rol con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRolDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un rol' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del rol.' })
  @ApiOkResponse({
    description: 'Rol eliminado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/roles', timestamp: '16/09/2026 10:30:00',
        message: 'Rol eliminado exitosamente',
        data: { id: 'uuid-rol', nombre: 'Administrador', invitado: false, activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un rol con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
