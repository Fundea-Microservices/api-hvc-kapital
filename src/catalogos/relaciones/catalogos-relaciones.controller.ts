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
import { CatalogosRelacionesService } from './catalogos-relaciones.service';
import {
  CreateCatalogoRelacionDto,
  PaginationCatalogoRelacionDto,
  UpdateCatalogoRelacionDto,
} from './dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

const EJEMPLO_CATALOGO_RELACION = {
  id: '9a7317f7-2b7c-45b2-99e1-47c61a6d8a5f',
  itemOrigenId: '541de9ac-3b27-4a12-81cf-b2fd83aa6ec7',
  itemDestinoId: '8d05ba77-f377-418d-a475-07b0b9603454',
  tipoRelacion: 'MONEDA_HABILITADA',
  atributos: { esMonedaBase: true, limiteDiario: 50000 },
  activo: true,
  created_at: '2026-11-18T10:30:00',
  updated_at: null,
  deleted_at: null,
};

@ApiTags('Catálogos - Relaciones')
@ApiBearerAuth('jwt')
@Controller('catalogos/relaciones')
export class CatalogosRelacionesController {
  constructor(
    private readonly catalogosRelacionesService: CatalogosRelacionesService,
  ) {}

  @Post()
  @RequirePermissions('CATALOGO_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear una relación entre ítems de catálogo',
    description:
      'Registra un cruce N:M entre dos ítems de catálogos. Origen y destino deben ser distintos y no puede repetirse la combinación (origen, destino, tipoRelacion).',
  })
  @ApiCreatedResponse({
    description: 'Relación creada correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: 'catalogos/relaciones',
        timestamp: '18/11/2026 10:30:00',
        message: 'Relación de catálogo creada exitosamente',
        data: EJEMPLO_CATALOGO_RELACION,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, ítems inexistentes o iguales, relación duplicada o JSON mal formado.',
  })
  create(@Body() createDto: CreateCatalogoRelacionDto) {
    return this.catalogosRelacionesService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar relaciones de catálogo',
    description:
      'Listado paginado (o completo con `todos=true`) con filtros `itemOrigenId`, `itemDestinoId`, `tipoRelacion` y `activo`.',
  })
  @ApiOkResponse({
    description: 'Listado de relaciones.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'catalogos/relaciones',
        timestamp: '18/11/2026 10:30:00',
        message: 'Relaciones de catálogo listadas correctamente',
        data: [EJEMPLO_CATALOGO_RELACION],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationCatalogoRelacionDto) {
    return this.catalogosRelacionesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una relación por su UUID' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID de la relación.',
  })
  @ApiOkResponse({
    description: 'Relación encontrada.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'catalogos/relaciones',
        timestamp: '18/11/2026 10:30:00',
        message: 'Relación de catálogo encontrada',
        data: EJEMPLO_CATALOGO_RELACION,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe la relación.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.catalogosRelacionesService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('CATALOGO_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar una relación de catálogo',
    description:
      'Actualización parcial. Si cambian los extremos o el tipoRelacion se revalidan existencia, vínculo consigo mismo y duplicados.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID de la relación.',
  })
  @ApiOkResponse({ description: 'Relación actualizada.' })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, relación/ítem inexistente, vínculo consigo mismo o duplicado.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateCatalogoRelacionDto,
  ) {
    return this.catalogosRelacionesService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('CATALOGO_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar una relación de catálogo',
    description: 'Eliminación lógica (soft-delete).',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID de la relación.',
  })
  @ApiOkResponse({ description: 'Relación eliminada.' })
  @ApiResponse({
    status: 400,
    description: 'El id no es válido o no existe la relación.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.catalogosRelacionesService.remove(id);
  }
}
