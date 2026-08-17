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
  createPermisoRol(@Body() createDto: CreatePermisoRolDto) {
    return this.permisoRolService.create(createDto);
  }

  @Get('rol')
  findAllPermisoRol(@Query() paginationDto: PaginationDto) {
    return this.permisoRolService.findAll(paginationDto);
  }

  @Get('rol/matriz')
  getMatrizPermisoRol(@Query() matrizDto: MatrizPermisoRolDto) {
    return this.permisoRolService.getMatrizByRol(matrizDto);
  }

  @Get('rol/:rolId/:permisoId')
  findOnePermisoRol(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.permisoRolService.findOne(rolId, permisoId);
  }

  @Delete('rol/:rolId/:permisoId')
  removePermisoRol(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.permisoRolService.remove(rolId, permisoId);
  }

  // ===================== Permiso_Usuario =====================

  @Post('usuario')
  createPermisoUsuario(@Body() createDto: CreatePermisoUsuarioDto) {
    return this.permisoUsuarioService.create(createDto);
  }

  @Get('usuario')
  findAllPermisoUsuario(@Query() paginationDto: PaginationDto) {
    return this.permisoUsuarioService.findAll(paginationDto);
  }

  @Get('usuario/:usuarioId/:permisoId')
  findOnePermisoUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.permisoUsuarioService.findOne(usuarioId, permisoId);
  }

  @Put('usuario/:usuarioId/:permisoId')
  updatePermisoUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
    @Body() updateDto: UpdatePermisoUsuarioDto,
  ) {
    return this.permisoUsuarioService.update(usuarioId, permisoId, updateDto);
  }

  @Delete('usuario/:usuarioId/:permisoId')
  removePermisoUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.permisoUsuarioService.remove(usuarioId, permisoId);
  }

  // ===================== Permiso =====================

  @Post()
  create(@Body() createDto: CreatePermisoDto) {
    return this.permisoService.create(createDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.permisoService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisoService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePermisoDto,
  ) {
    return this.permisoService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisoService.remove(id);
  }
}
