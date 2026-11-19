import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { CatalogosTiposService } from './catalogos-tipos.service';
import { CatalogosItemsService } from '../items/catalogos-items.service';
import {
  CreateCatalogoTipoDto,
  PaginationCatalogoTipoDto,
  UpdateCatalogoTipoDto,
} from './dto';
import { PaginationCatalogoItemDto } from '../items/dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

const EJEMPLO_CATALOGO_TIPO = {
  id: '3f46a1f3-1b4d-4b28-bc23-6f1c7ab9e67d',
  codigo: 'PAIS',
  nombre: 'Países del Sistema',
  descripcion: 'Catálogo de países disponibles para la operación',
  permiteJerarquia: false,
  esquemaAtributos: null,
  activo: true,
  created_at: '2026-11-18T10:30:00',
  updated_at: null,
  deleted_at: null,
};

@ApiTags('Catálogos - Tipos')
@ApiBearerAuth('jwt')
@Controller('catalogos/tipos')
export class CatalogosTiposController {
  constructor(
    private readonly catalogosTiposService: CatalogosTiposService,
    private readonly catalogosItemsService: CatalogosItemsService,
  ) {}

  @Post()
  @RequirePermissions('CATALOGO_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un tipo de catálogo',
    description:
      'Registra un catálogo maestro (PAIS, MONEDA, ...). El código se guarda en mayúsculas y debe ser único entre los catálogos vivos.',
  })
  @ApiCreatedResponse({
    description: 'Catálogo creado correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: 'catalogos/tipos',
        timestamp: '18/11/2026 10:30:00',
        message: 'Catálogo creado exitosamente',
        data: EJEMPLO_CATALOGO_TIPO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cuerpo inválido o ya existe un catálogo con ese código.',
  })
  create(@Body() createDto: CreateCatalogoTipoDto) {
    return this.catalogosTiposService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tipos de catálogo',
    description:
      'Listado paginado (o completo con `todos=true`) con búsqueda por código, nombre o descripción y filtros `activo` y `permiteJerarquia`. No incluye los eliminados.',
  })
  @ApiOkResponse({
    description: 'Listado de catálogos.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'catalogos/tipos',
        timestamp: '18/11/2026 10:30:00',
        message: 'Catálogos listados correctamente',
        data: [EJEMPLO_CATALOGO_TIPO],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationCatalogoTipoDto) {
    return this.catalogosTiposService.findAll(paginationDto);
  }

  @Get(':codigo/items')
  @ApiOperation({
    summary: 'Listar los ítems de un catálogo por su código',
    description:
      'Atajo de consulta para cargar un catálogo completo por código (ej. `PAIS`), con paginación, búsqueda y filtro de estado.',
  })
  @ApiParam({
    name: 'codigo',
    description: 'Código del catálogo (ej. PAIS, MONEDA).',
    example: 'PAIS',
  })
  @ApiOkResponse({ description: 'Ítems del catálogo solicitado.' })
  @ApiResponse({
    status: 400,
    description: 'No existe un catálogo con ese código.',
  })
  findItemsByCodigo(
    @Param('codigo') codigo: string,
    @Query() paginationDto: PaginationCatalogoItemDto,
  ) {
    return this.catalogosItemsService.findByTipoCodigo(codigo, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un tipo de catálogo por su UUID' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del catálogo.',
  })
  @ApiOkResponse({
    description: 'Catálogo encontrado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'catalogos/tipos',
        timestamp: '18/11/2026 10:30:00',
        message: 'Catálogo encontrado',
        data: EJEMPLO_CATALOGO_TIPO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe el catálogo.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.catalogosTiposService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('CATALOGO_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar un tipo de catálogo',
    description:
      'Actualización parcial. Cambiar `codigo` no afecta a los ítems porque referencian el catálogo por UUID.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del catálogo.',
  })
  @ApiOkResponse({ description: 'Catálogo actualizado.' })
  @ApiResponse({
    status: 400,
    description: 'Cuerpo inválido, no existe el catálogo o el código ya está en uso.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateCatalogoTipoDto,
  ) {
    return this.catalogosTiposService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('CATALOGO_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar un tipo de catálogo',
    description:
      'Eliminación lógica (soft-delete). Se bloquea si el catálogo conserva ítems vivos; en ese caso, desactívelo.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del catálogo.',
  })
  @ApiOkResponse({ description: 'Catálogo eliminado.' })
  @ApiResponse({
    status: 400,
    description:
      'El id no es válido, no existe el catálogo o tiene ítems asociados.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.catalogosTiposService.remove(id);
  }
}
