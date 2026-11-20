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
import { ConfigModulosService } from './config-modulos.service';
import {
  CreateConfigModuloDto,
  ReorderConfigModuloDto,
  UpdateConfigModuloDto,
} from '../dto';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
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
  created_at: '2026-11-20T10:30:00.000Z',
  updated_at: null,
  deleted_at: null,
};

const PATH = 'config/modulos';

@ApiTags('Config - Módulos')
@ApiBearerAuth('jwt')
@Controller(PATH)
export class ConfigModulosController {
  constructor(private readonly modulosService: ConfigModulosService) {}

  @Post()
  @RequirePermissions('CONFIG_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un módulo de configuración',
    description:
      'Registra un módulo de primer nivel (MOD_CREDITOS, MOD_COBRANZA, ...). El código se guarda en mayúsculas y debe ser único entre los módulos vivos; el `orden` debe estar libre (si se omite, se asigna al final).',
  })
  @ApiCreatedResponse({
    description: 'Módulo creado correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Módulo de configuración creado exitosamente',
        data: EJEMPLO_MODULO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, ya existe un módulo con ese código o el orden ya está ocupado.',
  })
  create(@Body() createDto: CreateConfigModuloDto) {
    return this.modulosService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar módulos de configuración',
    description:
      'Devuelve los módulos ordenados por `orden` y `nombre`, de forma paginada (o todos con `todos=true`). Filtros: `busqueda`, `activo`.',
  })
  @ApiOkResponse({
    description: 'Listado de módulos.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Módulos de configuración listados correctamente',
        data: [EJEMPLO_MODULO],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationActiveDto) {
    return this.modulosService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar un módulo de configuración por su UUID',
    description: 'Incluye sus políticas activas ordenadas por `orden`.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del módulo de configuración.',
  })
  @ApiOkResponse({
    description: 'Módulo encontrado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Módulo de configuración encontrado',
        data: {
          ...EJEMPLO_MODULO,
          politicas: [
            {
              id: 'b7e2f8a1-4c3d-4e9b-8a12-9f0c1d2e3f4a',
              moduloId: EJEMPLO_MODULO.id,
              codigo: 'POL_TASAS_COMISIONES',
              nombre: 'Tasas y Comisiones',
              descripcion: 'Tasas de interés, comisiones y cargos.',
              orden: 1,
              activo: true,
            },
          ],
        },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe un módulo con ese id.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.modulosService.findOne(id);
  }

  @Patch('reorder')
  @RequirePermissions('CONFIG_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Reordenar un módulo de configuración',
    description:
      'Cambia el `orden` de un módulo y desplaza de forma transaccional a los demás módulos vivos para no dejar huecos ni duplicados.',
  })
  @ApiOkResponse({
    description: 'Módulo reordenado correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 11:00:00',
        message: 'Módulo de configuración reordenado exitosamente',
        data: { ...EJEMPLO_MODULO, orden: 2 },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El cuerpo enviado no es válido o el módulo no existe.',
  })
  @ApiResponse({
    status: 428,
    description: 'Se requiere autorización previa (CONFIG_EDITAR).',
  })
  reorder(@Body() reorderDto: ReorderConfigModuloDto) {
    return this.modulosService.reorder(reorderDto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIG_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar un módulo de configuración',
    description:
      'Actualización parcial; permite asignar `menuId` cuando el módulo se vincule al menú.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del módulo de configuración.',
  })
  @ApiOkResponse({
    description: 'Módulo actualizado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Módulo de configuración actualizado exitosamente',
        data: { ...EJEMPLO_MODULO, activo: false },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cuerpo inválido, no existe el módulo o el código ya existe.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateConfigModuloDto,
  ) {
    return this.modulosService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIG_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar un módulo de configuración',
    description:
      'Eliminación lógica (soft-delete) que además marca `activo = false` y compacta el orden: los módulos posteriores bajan una posición. Se rechaza si el módulo tiene políticas activas.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del módulo de configuración.',
  })
  @ApiOkResponse({
    description: 'Módulo eliminado (foto previa al borrado).',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: PATH,
        timestamp: '20/11/2026 10:30:00',
        message: 'Módulo de configuración eliminado exitosamente',
        data: EJEMPLO_MODULO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'El id no es válido, no existe el módulo o tiene políticas activas.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.modulosService.remove(id);
  }
}
