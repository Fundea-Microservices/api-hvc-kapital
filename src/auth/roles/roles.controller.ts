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
  @ApiResponse({ status: 201, description: 'Rol creado correctamente.' })
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
  @ApiResponse({ status: 200, description: 'Listado de roles.' })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.rolesService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un rol por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del rol.' })
  @ApiResponse({ status: 200, description: 'Rol encontrado.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un rol con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del rol.' })
  @ApiResponse({ status: 200, description: 'Rol actualizado.' })
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
  @ApiResponse({ status: 200, description: 'Rol eliminado.' })
  @ApiResponse({ status: 404, description: 'No existe un rol con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
