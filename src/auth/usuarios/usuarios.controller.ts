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
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto, UpdateUsuarioDto, CambiarClaveDto, ResetClaveDto } from './dto';
import { PaginationUserDto } from './dto/pagination-user.dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';

@Controller('auth/usuarios')
@UseGuards(AdminOnlyGuard) // Aplicamos el Guard a nivel de controlador
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @AdminOnly() // Solo para usuarios con esAdmin: true
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  findAll(@Query() paginationUserDto: PaginationUserDto) {
    return this.usuariosService.findAll(paginationUserDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findOne(id);
  }

  @Put(':id')
  @AdminOnly() // Solo para usuarios con esAdmin: true
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @AdminOnly() // Solo para usuarios con esAdmin: true
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.remove(id);
  }

  // Resetear contraseña sin clave anterior (solo admin)
  @Post('reset-clave')
  @AdminOnly()
  resetClave(@Body() dto: ResetClaveDto) {
    return this.usuariosService.resetClave(dto.usuarioId, dto.claveNueva);
  }

  // Cambiar contraseña de usuario (Permitido para el usuario autenticado)
  @Post('cambiar-clave')
  cambiarClave(@Body() dto: CambiarClaveDto) {
    const { usuarioId, claveAnterior, claveNueva } = dto;
    return this.usuariosService.cambiarClave(
      usuarioId,
      claveAnterior,
      claveNueva,
    );
  }
}
