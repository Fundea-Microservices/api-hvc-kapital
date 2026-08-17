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
import { CreateUsuarioDto, UpdateUsuarioDto, CambiarClaveDto, ResetClaveDto } from './dto';
import { PaginationUserDto } from './dto/pagination-user.dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';

@ApiTags('Usuarios')
@ApiBearerAuth('jwt')
@Controller('auth/usuarios')
@UseGuards(AdminOnlyGuard) // Aplicamos el Guard a nivel de controlador
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @AdminOnly() // Solo para usuarios con esAdmin: true
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
  @AdminOnly() // Solo para usuarios con esAdmin: true
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
  @AdminOnly() // Solo para usuarios con esAdmin: true
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
