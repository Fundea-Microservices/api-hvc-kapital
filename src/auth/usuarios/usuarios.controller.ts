import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { AuthorizationExecutorService } from './authorization-executor.service';
import { CreateUsuarioDto, UpdateUsuarioDto, CambiarClaveDto, ResetClaveDto, ValidarAuthCodeDto, EjecutarConAutorizacionDto } from './dto';
import { PaginationUserDto } from './dto/pagination-user.dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Usuario } from 'database/entities/usuario.entity';

@ApiTags('Usuarios')
@ApiBearerAuth('jwt')
@Controller('auth/usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly authorizationExecutor: AuthorizationExecutorService,
  ) {}

  @Post()
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un usuario',
    description:
      'Da de alta un usuario y le asigna rol. Requiere que el solicitante sea administrador.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  @ApiResponse({ status: 403, description: 'Se requieren privilegios de administrador.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description:
      'Devuelve los usuarios de forma paginada. Admite filtros por rol, puesto y estado.',
  })
  @ApiResponse({ status: 200, description: 'Listado de usuarios.' })
  findAll(@Query() paginationUserDto: PaginationUserDto) {
    return this.usuariosService.findAll(paginationUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un usuario por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del usuario.' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un usuario con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findOne(id);
  }

  @Put(':id')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar un usuario',
    description: 'Requiere que el solicitante sea administrador.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del usuario.' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado.' })
  @ApiResponse({ status: 403, description: 'Se requieren privilegios de administrador.' })
  @ApiResponse({ status: 404, description: 'No existe un usuario con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar un usuario',
    description: 'Requiere que el solicitante sea administrador.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del usuario.' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado.' })
  @ApiResponse({ status: 403, description: 'Se requieren privilegios de administrador.' })
  @ApiResponse({ status: 404, description: 'No existe un usuario con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.remove(id);
  }

  // Resetear contraseña sin clave anterior (solo admin)
  @Post('reset-clave')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Restablecer la contraseña de un usuario',
    description:
      'Asigna una contraseña nueva sin pedir la anterior. Reservado a administradores; para que el propio usuario la cambie, usar cambiar-clave.',
  })
  @ApiResponse({ status: 201, description: 'Contraseña restablecida.' })
  @ApiResponse({ status: 403, description: 'Se requieren privilegios de administrador.' })
  @ApiResponse({ status: 404, description: 'No existe un usuario con ese id.' })
  resetClave(@Body() dto: ResetClaveDto) {
    return this.usuariosService.resetClave(dto.usuarioId, dto.claveNueva);
  }

  // ─── Endpoints de autorización ─────────────────────────────────────────────

  /**
   * POST /auth/usuarios/ejecutar-con-autorizacion
   * Endpoint unificado que valida autorización y ejecuta la operación en un solo paso.
   *
   * Flujo:
   * 1. Valida auth_code, permisos (Permiso_Rol / Permiso_Usuario), auto-autorización
   * 2. Ejecuta internamente el endpoint destino con el body proporcionado
   * 3. Registra la autorización en la bitácora
   * 4. Retorna el resultado de la ejecución + datos de auditoría
   */
  @Post('ejecutar-con-autorizacion')
  @ApiOperation({
    summary: 'Ejecutar operación con autorización en un solo paso',
    description:
      'Endpoint unificado que recibe todos los datos necesarios (endpoint, método, body, permisoId, auth_code), ' +
      'valida completamente la autorización en el backend y ejecuta la operación. ' +
      'Registra todo en la bitácora de autorización. El frontend solo necesita enviar un único request.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Operación ejecutada correctamente. Retorna el resultado de la ejecución ' +
      'junto con los datos de auditoría (solicitante, autorizador, permiso, fuente).',
  })
  @ApiResponse({
    status: 400,
    description:
      'AUTH-21-01: Auth_code no encontrado. | '
      + 'AUTH-21-02: Usuario autorizador inactivo. | '
      + 'AUTH-21-03: Usuario autorizador sin permiso para autorizar. | '
      + 'AUTH-21-04: Usuario logueado no encontrado. | '
      + 'AUTH-21-05: Auto-autorización prohibida. | '
      + 'AUTH-21-06: Permiso no encontrado. | '
      + 'AUTH-21-07: Autorizador sin autorización para el permiso específico.',
  })
  ejecutarConAutorizacion(
    @Body() dto: EjecutarConAutorizacionDto,
    @GetUser() user: Usuario,
  ) {
    return this.authorizationExecutor.ejecutarConAutorizacion(dto, user.id);
  }

  /**
   * GET /auth/usuarios/por-auth-code/:auth_code
   * Busca y retorna un usuario por su auth_code, validando que esté
   * habilitado para autorizar (activo = true, autoriza = true).
   * No requiere ser administrador; cualquier usuario autenticado puede consultarlo.
   */
  @Get('por-auth-code/:auth_code')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)  
  @ApiOperation({
    summary: 'Buscar usuario por auth_code',
    description:
      'Retorna la información de un usuario a partir de su auth_code. ' +
      'Valida que el usuario esté activo y tenga permisos para autorizar (autoriza = true). ' +
      'Cualquier usuario autenticado puede ejecutar esta consulta.',
  })
  @ApiParam({
    name: 'auth_code',
    description: 'Código de autorización del usuario a buscar.',
    example: 'A1B2C3',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado y validado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description:
      'AUTH-19-01: El auth_code está vacío. | '
      + 'AUTH-19-02: No se encontró ningún usuario con ese auth_code. | '
      + 'AUTH-19-03: El usuario no está activo. | '
      + 'AUTH-19-04: El usuario no tiene permisos para autorizar.',
  })
  findOneByAuthCode(@Param('auth_code') auth_code: string) {
    return this.usuariosService.findOneByAuthCode(auth_code);
  }

  /**
   * POST /auth/usuarios/validar-autorizacion
   * Valida un auth_code y retorna la información necesaria para registrar
   * una entrada en la bitácora de autorización.
   *
   * Reglas de validación:
   *  - El auth_code debe pertenecer a un usuario existente, activo y con autoriza = true.
   *  - Si el usuario logueado es admin y tiene auth_code propio, no puede autorizarse
   *    a sí mismo (el auth_code enviado debe ser diferente al propio).
   *
   * No requiere ser administrador; cualquier usuario autenticado puede ejecutarlo.
   */
  @Post('validar-autorizacion')
  @ApiOperation({
    summary: 'Validar auth_code y permiso para autorización',
    description:
      'Valida un auth_code y un permiso específico contra las reglas de negocio. ' +
      'El autorizador debe: (1) existir, estar activo y tener autoriza=true general; ' +
      '(2) tener autoriza=true para el permiso indicado ya sea por su rol (Permiso_Rol) ' +
      'o directamente (Permiso_Usuario). ' +
      'Si el usuario logueado es admin, no podrá usar su propio auth_code (auto-autorización prohibida).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Autorización validada. Retorna solicitanteId, solicitanteNombre, ' +
      'solicitanteUsuario, autorizadorId, autorizadorNombre, autorizadorUsuario, ' +
      'permisoId, permisoCodigo, permisoModulo, permisoAccion, fuenteAutorizacion.',
  })
  @ApiResponse({
    status: 400,
    description:
      'AUTH-20-01: Auth_code no encontrado. | '
      + 'AUTH-20-02: Usuario autorizador inactivo. | '
      + 'AUTH-20-03: Usuario autorizador sin permiso para autorizar. | '
      + 'AUTH-20-04: Usuario logueado no encontrado. | '
      + 'AUTH-20-05: Auto-autorización prohibida. | '
      + 'AUTH-20-06: Permiso no encontrado. | '
      + 'AUTH-20-07: Autorizador sin autorización para el permiso específico.',
  })
  validarAutorizacion(
    @Body() validarAuthCodeDto: ValidarAuthCodeDto,
    @GetUser() user: Usuario,
  ) {
    return this.usuariosService.validarAutorizacion(validarAuthCodeDto, user.id);
  }

  // Cambiar contraseña de usuario (Permitido para el usuario autenticado)
  @Post('cambiar-clave')
  @ApiOperation({
    summary: 'Cambiar la contraseña propia',
    description:
      'El usuario autenticado cambia su contraseña aportando la anterior. No requiere ser administrador.',
  })
  @ApiResponse({ status: 201, description: 'Contraseña actualizada.' })
  @ApiResponse({ status: 400, description: 'La contraseña anterior no coincide.' })
  @ApiResponse({ status: 404, description: 'No existe un usuario con ese id.' })
  cambiarClave(@Body() dto: CambiarClaveDto) {
    const { usuarioId, claveAnterior, claveNueva } = dto;
    return this.usuariosService.cambiarClave(
      usuarioId,
      claveAnterior,
      claveNueva,
    );
  }
}
