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
  HttpCode,
  HttpStatus,
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
import { PermisoService } from './permiso.service';
import { PermisoRolService } from './permiso-rol.service';
import { PermisoUsuarioService } from './permiso-usuario.service';
import {
  CreatePermisoDto,
  UpdatePermisoDto,
  CreatePermisoRolDto,
  MatrizPermisoRolDto,
  CreatePermisoUsuarioDto,
  UpdatePermisoUsuarioDto,
} from './dto';
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

  // ===================== Verificar Autorización =====================

  @Post('verificar-autorizacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar si un usuario tiene autorización para un permiso',
    description:
      'Valida si el usuario (o su rol) tiene campo autoriza = true para el permiso indicado. ' +
      'Primero verifica la tabla Permiso_Rol (por el rol del usuario); si no tiene autorización ahí, ' +
      'verifica la tabla Permiso_Usuario (asignación directa al usuario). ' +
      'Devuelve { tieneAutorizacion: boolean, fuente: "rol" | "usuario" | null }.',
  })
  @ApiOkResponse({
    description: 'Resultado de la verificación.',
    schema: {
      example: {
        tieneAutorizacion: true,
        fuente: 'rol',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  async verificarAutorizacion(@Body() body: { permisoId: string; usuarioId: string }) {
    return this.permisoService.verificarAutorizacion(body.usuarioId, body.permisoId);
  }

  // ===================== Permiso_Rol =====================
  // Se declaran antes que las rutas con :id para evitar colisiones

  @Post('rol')
  @ApiOperation({
    summary: 'Asignar un permiso a un rol',
    description: 'Concede un permiso a todos los usuarios que tengan ese rol.',
  })
  @ApiCreatedResponse({
    description: 'Permiso asignado al rol.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Permiso asignado al rol exitosamente',
        data: { rolId: 'uuid-rol', permisoId: 'uuid-permiso', autoriza: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  createPermisoRol(@Body() createDto: CreatePermisoRolDto) {
    return this.permisoRolService.create(createDto);
  }

  @Get('rol')
  @ApiOperation({
    summary: 'Listar asignaciones permiso-rol',
    description: 'Devuelve de forma paginada qué permisos tiene cada rol.',
  })
  @ApiOkResponse({
    description: 'Listado de asignaciones permiso-rol.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Listado de asignaciones',
        data: [
          { rolId: 'uuid-rol', permisoId: 'uuid-permiso', autoriza: true, rol: { nombre: 'Admin' }, permiso: { codigo: 'USR_CREAR', modulo: 'Usuarios', accion: 'Crear' } },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAllPermisoRol(@Query() paginationDto: PaginationDto) {
    return this.permisoRolService.findAll(paginationDto);
  }

  @Get('rol/matriz')
  @ApiOperation({
    summary: 'Matriz de permisos de un rol',
    description:
      'Devuelve todos los permisos existentes indicando cuáles tiene concedidos el rol. Pensado para pintar la pantalla de asignación de permisos.',
  })
  @ApiOkResponse({
    description: 'Matriz de permisos del rol.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Matriz obtenida correctamente',
        data: [
          { id: 'uuid-permiso', codigo: 'USR_CREAR', modulo: 'Usuarios', accion: 'Crear', tienePermiso: true, autoriza: false },
          { id: 'uuid-permiso-2', codigo: 'USR_EDITAR', modulo: 'Usuarios', accion: 'Editar', tienePermiso: false, autoriza: false },
        ],
        metadata: null,
      },
    },
  })
  getMatrizPermisoRol(@Query() matrizDto: MatrizPermisoRolDto) {
    return this.permisoRolService.getMatrizByRol(matrizDto);
  }

  @Get('rol/:rolId/:permisoId')
  @ApiOperation({ summary: 'Consultar una asignación permiso-rol concreta' })
  @ApiParam({ name: 'rolId', format: 'uuid', description: 'UUID del rol.' })
  @ApiParam({ name: 'permisoId', format: 'uuid', description: 'UUID del permiso.' })
  @ApiOkResponse({
    description: 'Asignación permiso-rol encontrada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Asignación encontrada',
        data: { rolId: 'uuid-rol', permisoId: 'uuid-permiso', autoriza: true },
        metadata: null,
      },
    },
  })
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
  @ApiOkResponse({
    description: 'Asignación permiso-rol eliminada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Asignación eliminada exitosamente',
        data: null,
        metadata: null,
      },
    },
  })
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
  @ApiCreatedResponse({
    description: 'Permiso asignado al usuario.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Permiso asignado al usuario exitosamente',
        data: { usuarioId: 'uuid-usuario', permisoId: 'uuid-permiso', autoriza: true },
        metadata: null,
      },
    },
  })
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
  @ApiOkResponse({
    description: 'Listado de asignaciones permiso-usuario.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Listado de asignaciones',
        data: [
          { usuarioId: 'uuid-usuario', permisoId: 'uuid-permiso', autoriza: true, usuario: { nombreCompleto: 'Juan Pérez' }, permiso: { codigo: 'USR_CREAR', modulo: 'Usuarios', accion: 'Crear' } },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAllPermisoUsuario(@Query() paginationDto: PaginationDto) {
    return this.permisoUsuarioService.findAll(paginationDto);
  }

  @Get('usuario/:usuarioId/:permisoId')
  @ApiOperation({ summary: 'Consultar una asignación permiso-usuario concreta' })
  @ApiParam({ name: 'usuarioId', format: 'uuid', description: 'UUID del usuario.' })
  @ApiParam({ name: 'permisoId', format: 'uuid', description: 'UUID del permiso.' })
  @ApiOkResponse({
    description: 'Asignación permiso-usuario encontrada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Asignación encontrada',
        data: { usuarioId: 'uuid-usuario', permisoId: 'uuid-permiso', autoriza: true },
        metadata: null,
      },
    },
  })
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
  @ApiOkResponse({
    description: 'Asignación permiso-usuario actualizada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Asignación actualizada exitosamente',
        data: { usuarioId: 'uuid-usuario', permisoId: 'uuid-permiso', autoriza: false },
        metadata: null,
      },
    },
  })
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
  @ApiOkResponse({
    description: 'Asignación permiso-usuario eliminada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Asignación eliminada exitosamente',
        data: null,
        metadata: null,
      },
    },
  })
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
  @ApiCreatedResponse({
    description: 'Permiso creado correctamente.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Permiso creado exitosamente',
        data: { id: 'uuid-permiso', codigo: 'USR_CREAR', modulo: 'Usuarios', accion: 'Crear', descripcion: 'Crear usuarios', activo: true, requires_auth: true, created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createDto: CreatePermisoDto) {
    return this.permisoService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar permisos',
    description: 'Devuelve el catálogo de permisos de forma paginada.',
  })
  @ApiOkResponse({
    description: 'Listado de permisos.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Permisos listados correctamente',
        data: [
          { id: 'uuid-1', codigo: 'USR_CREAR', modulo: 'Usuarios', accion: 'Crear', activo: true, requires_auth: true },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.permisoService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un permiso por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del permiso.' })
  @ApiOkResponse({
    description: 'Permiso encontrado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Permiso encontrado',
        data: { id: 'uuid-permiso', codigo: 'USR_CREAR', modulo: 'Usuarios', accion: 'Crear', descripcion: 'Crear usuarios', activo: true, requires_auth: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un permiso con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisoService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un permiso' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del permiso.' })
  @ApiOkResponse({
    description: 'Permiso actualizado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Permiso actualizado exitosamente',
        data: { id: 'uuid-permiso', codigo: 'USR_CREAR', modulo: 'Usuarios', accion: 'Crear', activo: true },
        metadata: null,
      },
    },
  })
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
  @ApiOkResponse({
    description: 'Permiso eliminado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/permisos', timestamp: '16/09/2026 10:30:00',
        message: 'Permiso eliminado exitosamente',
        data: { id: 'uuid-permiso', codigo: 'USR_CREAR', modulo: 'Usuarios', accion: 'Crear', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un permiso con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisoService.remove(id);
  }
}
