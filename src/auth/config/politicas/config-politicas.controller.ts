import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { ConfigPoliticasService } from './config-politicas.service';
import {
  CreateConfigPoliticaDto,
  PaginationConfigPoliticaDto,
  ReorderConfigPoliticaDto,
  UpdateConfigPoliticaDto,
} from '../dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

const EJEMPLO_MODULO = {
  id: 'a1b2c3d4-e5f6-4789-9012-3456789abcde',
  codigo: 'MOD_CREDITOS',
  nombre: 'Créditos',
  descripcion: 'Parámetros de originación, tasas y comisiones.',
  orden: 1,
  menuId: null,
  activo: true,
};

const EJEMPLO_POLITICA = {
  id: 'b7e2f8a1-4c3d-4e9b-8a12-9f0c1d2e3f4a',
  moduloId: EJEMPLO_MODULO.id,
  codigo: 'POL_TASAS_COMISIONES',
  nombre: 'Tasas y Comisiones',
  descripcion: 'Tasas de interés, comisiones y cargos aplicables.',
  orden: 1,
  activo: true,
  created_at: '2026-11-20T10:30:00.000Z',
  updated_at: null,
  deleted_at: null,
};

const PATH = 'config/politicas';

@ApiTags('Config - Políticas')
@ApiBearerAuth('jwt')
@Controller(PATH)
export class ConfigPoliticasController {
  constructor(private readonly politicasService: ConfigPoliticasService) {}

  @Post()
  @RequirePermissions('CONFIG_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear una política de configuración',
    description:
      'Registra una política de segundo nivel dentro de un módulo. Valida que `moduloId` exista y que el `codigo` sea único entre las políticas vivas.',
  })
  @ApiCreatedResponse({
    description: 'Política creada correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Política de configuración creada exitosamente',
        data: EJEMPLO_POLITICA,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, no existe el módulo o ya existe una política con ese código.',
  })
  create(@Body() createDto: CreateConfigPoliticaDto) {
    return this.politicasService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar políticas de configuración',
    description:
      'Devuelve las políticas ordenadas por `orden` y `nombre`, con su módulo, de forma paginada (o todas con `todos=true`). Filtros: `moduloId`, `busqueda`, `activo`.',
  })
  @ApiOkResponse({
    description: 'Listado de políticas.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Políticas de configuración listadas correctamente',
        data: [{ ...EJEMPLO_POLITICA, modulo: EJEMPLO_MODULO }],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationConfigPoliticaDto) {
    return this.politicasService.findAll(paginationDto);
  }

  @Get(':politicaId/modulo')
  @ApiOperation({
    summary: 'Obtener el módulo de una política',
    description:
      'Resuelve el `moduloId` y los datos básicos del módulo padre a partir de un `politicaId`. Útil para preseleccionar el combo de Módulo al editar un parámetro `Config`.',
  })
  @ApiParam({
    name: 'politicaId',
    format: 'uuid',
    description: 'UUID de la política de configuración.',
  })
  @ApiOkResponse({
    description: 'Módulo resuelto a partir de la política.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Módulo obtenido correctamente a partir de la política',
        data: {
          politicaId: EJEMPLO_POLITICA.id,
          moduloId: EJEMPLO_MODULO.id,
          modulo: {
            id: EJEMPLO_MODULO.id,
            codigo: EJEMPLO_MODULO.codigo,
            nombre: EJEMPLO_MODULO.nombre,
            activo: EJEMPLO_MODULO.activo,
          },
        },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El politicaId no es un UUID válido.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe una política viva con ese id.',
  })
  findModuloByPolitica(@Param('politicaId', ParseGuidPipe) politicaId: string) {
    return this.politicasService.findModuloByPolitica(politicaId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar una política de configuración por su UUID',
    description: 'Incluye la relación `modulo`.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID de la política de configuración.',
  })
  @ApiOkResponse({
    description: 'Política encontrada.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Política de configuración encontrada',
        data: { ...EJEMPLO_POLITICA, modulo: EJEMPLO_MODULO },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'El id no es un UUID válido o no existe una política con ese id.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.politicasService.findOne(id);
  }

  @Patch('reorder')
  @RequirePermissions('CONFIG_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Reordenar una política de configuración',
    description:
      'Cambia el `orden` de una política y desplaza de forma transaccional a las políticas hermanas del mismo módulo (incluidas las inactivas) para no dejar huecos ni duplicados.',
  })
  @ApiOkResponse({
    description: 'Política reordenada correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 11:00:00',
        message: 'Política de configuración reordenada exitosamente',
        data: { ...EJEMPLO_POLITICA, orden: 2 },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El cuerpo enviado no es válido o la política no existe.',
  })
  @ApiResponse({
    status: 428,
    description: 'Se requiere autorización previa (CONFIG_EDITAR).',
  })
  reorder(@Body() reorderDto: ReorderConfigPoliticaDto) {
    return this.politicasService.reorder(reorderDto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIG_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar una política de configuración',
    description:
      'Actualización parcial; permite reasignar `moduloId` validando que el módulo exista.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID de la política de configuración.',
  })
  @ApiOkResponse({
    description: 'Política actualizada.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Política de configuración actualizada exitosamente',
        data: { ...EJEMPLO_POLITICA, activo: false },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, no existe la política o el módulo, o el código ya existe.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateConfigPoliticaDto,
  ) {
    return this.politicasService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIG_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar una política de configuración',
    description:
      'Eliminación lógica (soft-delete) que además marca `activo = false`. Se rechaza si la política tiene parámetros `Config` activos.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID de la política de configuración.',
  })
  @ApiOkResponse({
    description: 'Política eliminada (foto previa al borrado).',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Política de configuración eliminada exitosamente',
        data: EJEMPLO_POLITICA,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'El id no es válido, no existe la política o tiene parámetros activos.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.politicasService.remove(id);
  }
}
