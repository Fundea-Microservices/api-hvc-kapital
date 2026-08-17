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
import { PermisoService } from './permiso.service';
import { PermisoRolService } from './permiso-rol.service';
import { PermisoUsuarioService } from './permiso-usuario.service';
import { CreatePermisoDto, UpdatePermisoDto } from './dto/permiso.dto';
import { CreatePermisoRolDto, MatrizPermisoRolDto } from './dto/permiso-rol.dto';
import {
  CreatePermisoUsuarioDto,
  UpdatePermisoUsuarioDto,
} from './dto/permiso-usuario.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Permisos')
@ApiBearerAuth('jwt')
@Controller('auth/permisos')
export class PermisosController {
  constructor(
    private readonly permisoService: PermisoService,
    private readonly permisoRolService: PermisoRolService,
    private readonly permisoUsuarioService: PermisoUsuarioService,
  ) {}

  // ===================== Permiso_Rol =====================
  // Se declaran antes que las rutas con :id para evitar colisiones

  @Post('rol')
  @ApiOperation({
    summary: 'Asignar un permiso a un rol',
    description: 'Concede un permiso a todos los usuarios que tengan ese rol.',
  })
  @ApiResponse({ status: 201, description: 'Permiso asignado al rol.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  createPermisoRol(@Body() createDto: CreatePermisoRolDto) {
    return this.permisoRolService.create(createDto);
  }

  @Get('rol')
  @ApiOperation({
    summary: 'Listar asignaciones permiso-rol',
    description: 'Devuelve de forma paginada qué permisos tiene cada rol.',
  })
  @ApiResponse({ status: 200, description: 'Listado de asignaciones.' })
  findAllPermisoRol(@Query() paginationDto: PaginationDto) {
    return this.permisoRolService.findAll(paginationDto);
  }

  @Get('rol/matriz')
  @ApiOperation({
    summary: 'Matriz de permisos de un rol',
    description:
      'Devuelve todos los permisos existentes indicando cuáles tiene concedidos el rol. Pensado para pintar la pantalla de asignación de permisos.',
  })
  @ApiResponse({ status: 200, description: 'Matriz de permisos del rol.' })
  getMatrizPermisoRol(@Query() matrizDto: MatrizPermisoRolDto) {
    return this.permisoRolService.getMatrizByRol(matrizDto);
  }

  @Get('rol/:rolId/:permisoId')
  @ApiOperation({ summary: 'Consultar una asignación permiso-rol concreta' })
  @ApiParam({ name: 'rolId', format: 'uuid', description: 'UUID del rol.' })
  @ApiParam({ name: 'permisoId', format: 'uuid', description: 'UUID del permiso.' })
  @ApiResponse({ status: 200, description: 'Asignación encontrada.' })
  @ApiResponse({ status: 404, description: 'La asignación no existe.' })
  findOnePermisoRol(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.permisoRolService.findOne(rolId, permisoId);
  }

  @Delete('rol/:rolId/:permisoId')
  @ApiOperation({
    summary: 'Revocar un permiso a un rol',
    description: 'Elimina la asignación; afecta a todos los usuarios con ese rol.',
  })
  @ApiParam({ name: 'rolId', format: 'uuid', description: 'UUID del rol.' })
  @ApiParam({ name: 'permisoId', format: 'uuid', description: 'UUID del permiso.' })
  @ApiResponse({ status: 200, description: 'Asignación eliminada.' })
  @ApiResponse({ status: 404, description: 'La asignación no existe.' })
  removePermisoRol(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.permisoRolService.remove(rolId, permisoId);
  }

  // ===================== Permiso_Usuario =====================

  @Post('usuario')
  @ApiOperation({
    summary: 'Asignar un permiso a un usuario',
    description:
      'Concede un permiso a un usuario concreto, además de los que hereda por su rol.',
  })
  @ApiResponse({ status: 201, description: 'Permiso asignado al usuario.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  createPermisoUsuario(@Body() createDto: CreatePermisoUsuarioDto) {
    return this.permisoUsuarioService.create(createDto);
  }

  @Get('usuario')
  @ApiOperation({
    summary: 'Listar asignaciones permiso-usuario',
    description:
      'Devuelve de forma paginada los permisos concedidos directamente a usuarios.',
  })
  @ApiResponse({ status: 200, description: 'Listado de asignaciones.' })
  findAllPermisoUsuario(@Query() paginationDto: PaginationDto) {
    return this.permisoUsuarioService.findAll(paginationDto);
  }

  @Get('usuario/:usuarioId/:permisoId')
  @ApiOperation({ summary: 'Consultar una asignación permiso-usuario concreta' })
  @ApiParam({ name: 'usuarioId', format: 'uuid', description: 'UUID del usuario.' })
  @ApiParam({ name: 'permisoId', format: 'uuid', description: 'UUID del permiso.' })
  @ApiResponse({ status: 200, description: 'Asignación encontrada.' })
  @ApiResponse({ status: 404, description: 'La asignación no existe.' })
  findOnePermisoUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.permisoUsuarioService.findOne(usuarioId, permisoId);
  }

  @Put('usuario/:usuarioId/:permisoId')
  @ApiOperation({ summary: 'Actualizar una asignación permiso-usuario' })
  @ApiParam({ name: 'usuarioId', format: 'uuid', description: 'UUID del usuario.' })
  @ApiParam({ name: 'permisoId', format: 'uuid', description: 'UUID del permiso.' })
  @ApiResponse({ status: 200, description: 'Asignación actualizada.' })
  @ApiResponse({ status: 404, description: 'La asignación no existe.' })
  updatePermisoUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
    @Body() updateDto: UpdatePermisoUsuarioDto,
  ) {
    return this.permisoUsuarioService.update(usuarioId, permisoId, updateDto);
  }

  @Delete('usuario/:usuarioId/:permisoId')
  @ApiOperation({ summary: 'Revocar un permiso a un usuario' })
  @ApiParam({ name: 'usuarioId', format: 'uuid', description: 'UUID del usuario.' })
  @ApiParam({ name: 'permisoId', format: 'uuid', description: 'UUID del permiso.' })
  @ApiResponse({ status: 200, description: 'Asignación eliminada.' })
  @ApiResponse({ status: 404, description: 'La asignación no existe.' })
  removePermisoUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.permisoUsuarioService.remove(usuarioId, permisoId);
  }

  // ===================== Permiso =====================

  @Post()
  @ApiOperation({
    summary: 'Crear un permiso',
    description:
      'Da de alta un permiso en el catálogo, para poder asignarlo luego a roles o usuarios.',
  })
  @ApiResponse({ status: 201, description: 'Permiso creado correctamente.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createDto: CreatePermisoDto) {
    return this.permisoService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar permisos',
    description: 'Devuelve el catálogo de permisos de forma paginada.',
  })
  @ApiResponse({ status: 200, description: 'Listado de permisos.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.permisoService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un permiso por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del permiso.' })
  @ApiResponse({ status: 200, description: 'Permiso encontrado.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un permiso con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisoService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un permiso' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del permiso.' })
  @ApiResponse({ status: 200, description: 'Permiso actualizado.' })
  @ApiResponse({ status: 404, description: 'No existe un permiso con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePermisoDto,
  ) {
    return this.permisoService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un permiso del catálogo' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del permiso.' })
  @ApiResponse({ status: 200, description: 'Permiso eliminado.' })
  @ApiResponse({ status: 404, description: 'No existe un permiso con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisoService.remove(id);
  }
}
