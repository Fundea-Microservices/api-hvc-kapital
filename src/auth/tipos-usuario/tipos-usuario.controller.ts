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
import { TiposUsuarioService } from './tipos-usuario.service';
import {
  CreateTipoUsuarioDto,
  PaginationTipoUsuarioDto,
  UpdateTipoUsuarioDto,
} from './dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

const EJEMPLO_TIPO_USUARIO = {
  id: 'uuid-tipo-usuario',
  codigo: 'INVERSOR',
  nombre: 'Inversor',
  descripcion: 'Clientes que invierten en productos de HVC Kapital',
  activo: true,
  created_at: '2026-11-10T10:30:00',
  updated_at: null,
  deleted_at: null,
};

@ApiTags('Tipos de usuario')
@ApiBearerAuth('jwt')
@Controller('auth/tipos-usuario')
export class TiposUsuarioController {
  constructor(private readonly tiposUsuarioService: TiposUsuarioService) {}

  @Post()
  @RequirePermissions('TIPO_USUARIO_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un tipo de usuario',
    description:
      'Registra un tipo de usuario (INVERSOR, EMPLEADO, ...). El código se guarda en mayúsculas y debe ser único.',
  })
  @ApiCreatedResponse({
    description: 'Tipo de usuario creado correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: 'auth/tipos-usuario',
        timestamp: '10/11/2026 10:30:00',
        message: 'Tipo de usuario creado exitosamente',
        data: EJEMPLO_TIPO_USUARIO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cuerpo inválido o ya existe un tipo con ese código.',
  })
  create(@Body() createDto: CreateTipoUsuarioDto) {
    return this.tiposUsuarioService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tipos de usuario',
    description:
      'Devuelve los tipos de usuario de forma paginada (o todos con `todos=true`), ordenados por nombre. ' +
      'Filtro `estado`: `todos` (por defecto), `activos` o `inactivos`. ' +
      'Búsqueda por código, nombre o descripción. No incluye los eliminados.',
  })
  @ApiOkResponse({
    description: 'Listado de tipos de usuario.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'auth/tipos-usuario',
        timestamp: '10/11/2026 10:30:00',
        message: 'Tipos de usuario listados correctamente',
        data: [
          {
            ...EJEMPLO_TIPO_USUARIO,
            codigo: 'EMPLEADO',
            nombre: 'Empleado',
            descripcion: 'Colaboradores de HVC Kapital',
          },
          EJEMPLO_TIPO_USUARIO,
        ],
        metadata: { total: 2, page: 1, limit: 10 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos.',
  })
  findAll(@Query() paginationDto: PaginationTipoUsuarioDto) {
    return this.tiposUsuarioService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un tipo de usuario por su UUID' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del tipo de usuario.',
  })
  @ApiOkResponse({
    description: 'Tipo de usuario encontrado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'auth/tipos-usuario',
        timestamp: '10/11/2026 10:30:00',
        message: 'Tipo de usuario encontrado',
        data: EJEMPLO_TIPO_USUARIO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe un tipo con ese id.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.tiposUsuarioService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('TIPO_USUARIO_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar un tipo de usuario',
    description:
      'Actualización parcial. El código solo se puede cambiar si ningún elemento del carrusel lo usa.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del tipo de usuario.',
  })
  @ApiOkResponse({
    description: 'Tipo de usuario actualizado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'auth/tipos-usuario',
        timestamp: '10/11/2026 10:30:00',
        message: 'Tipo de usuario actualizado exitosamente',
        data: {
          ...EJEMPLO_TIPO_USUARIO,
          activo: false,
          updated_at: '2026-11-11T08:00:00',
        },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, no existe el tipo, el código ya existe o el código está en uso en el carrusel.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateTipoUsuarioDto,
  ) {
    return this.tiposUsuarioService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('TIPO_USUARIO_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar un tipo de usuario',
    description:
      'Eliminación lógica (soft-delete). No se permite si algún elemento del carrusel usa el código; en ese caso, desactívelo.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del tipo de usuario.',
  })
  @ApiOkResponse({
    description: 'Tipo de usuario eliminado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'auth/tipos-usuario',
        timestamp: '10/11/2026 10:30:00',
        message: 'Tipo de usuario eliminado exitosamente',
        data: EJEMPLO_TIPO_USUARIO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'El id no es válido, no existe o el tipo está en uso en el carrusel.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.tiposUsuarioService.remove(id);
  }
}
