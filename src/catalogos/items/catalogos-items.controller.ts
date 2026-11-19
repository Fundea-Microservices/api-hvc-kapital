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
import { CatalogosItemsService } from './catalogos-items.service';
import {
  CreateCatalogoItemDto,
  PaginationCatalogoItemDto,
  UpdateCatalogoItemDto,
} from './dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

const EJEMPLO_CATALOGO_ITEM = {
  id: '541de9ac-3b27-4a12-81cf-b2fd83aa6ec7',
  catalogoTipoId: '3f46a1f3-1b4d-4b28-bc23-6f1c7ab9e67d',
  padreId: null,
  codigo: 'GT',
  nombre: 'Guatemala',
  valor: '502',
  orden: 1,
  atributos: { codigoTelefono: '+502', iso3: 'GTM' },
  activo: true,
  created_at: '2026-11-18T10:30:00',
  updated_at: null,
  deleted_at: null,
};

@ApiTags('Catálogos - Ítems')
@ApiBearerAuth('jwt')
@Controller('catalogos/items')
export class CatalogosItemsController {
  constructor(private readonly catalogosItemsService: CatalogosItemsService) {}

  @Post()
  @RequirePermissions('CATALOGO_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un ítem de catálogo',
    description:
      'Registra un ítem dentro de un catálogo. Si se envía `padreId`, el catálogo debe tener `permiteJerarquia = true`, el padre debe pertenecer al mismo catálogo y el código no puede repetirse dentro del catálogo.',
  })
  @ApiCreatedResponse({
    description: 'Ítem creado correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: 'catalogos/items',
        timestamp: '18/11/2026 10:30:00',
        message: 'Ítem de catálogo creado exitosamente',
        data: EJEMPLO_CATALOGO_ITEM,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, catálogo inexistente/inactivo, jerarquía no permitida, padre inválido, código duplicado o JSON mal formado.',
  })
  create(@Body() createDto: CreateCatalogoItemDto) {
    return this.catalogosItemsService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar ítems de catálogo',
    description:
      'Listado paginado (o completo con `todos=true`) con filtros `catalogoTipoId`, `padreId`, `activo` y búsqueda por código, nombre o valor. Ordenado por `orden` y nombre.',
  })
  @ApiOkResponse({
    description: 'Listado de ítems.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'catalogos/items',
        timestamp: '18/11/2026 10:30:00',
        message: 'Ítems de catálogo listados correctamente',
        data: [EJEMPLO_CATALOGO_ITEM],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationCatalogoItemDto) {
    return this.catalogosItemsService.findAll(paginationDto);
  }

  @Get(':id/arbol')
  @ApiOperation({
    summary: 'Obtener el árbol jerárquico de un ítem',
    description:
      'Devuelve el ítem solicitado como raíz con todos sus descendientes por `padreId`, ordenados por `orden` y nombre.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del ítem raíz del árbol.',
  })
  @ApiOkResponse({ description: 'Árbol jerárquico del ítem.' })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe el ítem.',
  })
  findArbol(@Param('id', ParseGuidPipe) id: string) {
    return this.catalogosItemsService.findArbol(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un ítem de catálogo por su UUID' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del ítem.',
  })
  @ApiOkResponse({
    description: 'Ítem encontrado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'catalogos/items',
        timestamp: '18/11/2026 10:30:00',
        message: 'Ítem de catálogo encontrado',
        data: EJEMPLO_CATALOGO_ITEM,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe el ítem.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.catalogosItemsService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('CATALOGO_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar un ítem de catálogo',
    description:
      'Actualización parcial. Cambiar `padreId` revalida jerarquía, pertenencia al catálogo y ciclos. Enviar `padreId: null` quita el padre.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del ítem.',
  })
  @ApiOkResponse({ description: 'Ítem actualizado.' })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, ítem/catálogo inexistente, catálogo inactivo, ciclo jerárquico o código duplicado.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateCatalogoItemDto,
  ) {
    return this.catalogosItemsService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('CATALOGO_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar un ítem de catálogo',
    description:
      'Eliminación lógica (soft-delete). Se bloquea si el ítem tiene hijos en la jerarquía o relaciones vigentes; en ese caso, desactívelo.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del ítem.',
  })
  @ApiOkResponse({ description: 'Ítem eliminado.' })
  @ApiResponse({
    status: 400,
    description:
      'El id no es válido, no existe, o el ítem tiene hijos o relaciones vigentes.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.catalogosItemsService.remove(id);
  }
}
