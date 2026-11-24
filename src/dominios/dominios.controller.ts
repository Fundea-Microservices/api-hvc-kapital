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
import { DominiosService } from './dominios.service';
import { DominioValoresService } from './valores/dominio-valores.service';
import {
  CreateDominioDto,
  PaginationDominioDto,
  UpdateDominioDto,
} from './dto';
import { PaginationDominioValorDto } from './valores/dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

const EJEMPLO_DOMINIO = {
  id: '3f46a1f3-1b4d-4b28-bc23-6f1c7ab9e67d',
  codigo: 'PAIS',
  nombre: 'Países del Sistema',
  descripcion: 'Dominio de países disponibles para la operación',
  permiteJerarquia: false,
  esquemaAtributos: null,
  activo: true,
  created_at: '2026-11-18T10:30:00',
  updated_at: null,
  deleted_at: null,
};

@ApiTags('Dominios')
@ApiBearerAuth('jwt')
@Controller('dominios')
export class DominiosController {
  constructor(
    private readonly dominiosService: DominiosService,
    private readonly dominioValoresService: DominioValoresService,
  ) {}

  @Post()
  @RequirePermissions('DOMINIO_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un dominio maestro',
    description:
      'Registra un dominio (PAIS, MONEDA, ...). El código se guarda en mayúsculas y debe ser único entre los dominios vivos.',
  })
  @ApiCreatedResponse({
    description: 'Dominio creado correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: 'dominios',
        timestamp: '18/11/2026 10:30:00',
        message: 'Dominio creado exitosamente',
        data: EJEMPLO_DOMINIO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cuerpo inválido o ya existe un dominio con ese código.',
  })
  create(@Body() createDto: CreateDominioDto) {
    return this.dominiosService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar dominios maestros',
    description:
      'Listado paginado (o completo con `todos=true`) con búsqueda por código, nombre o descripción y filtros `activo` y `permiteJerarquia`. No incluye los eliminados.',
  })
  @ApiOkResponse({
    description: 'Listado de dominios.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'dominios',
        timestamp: '18/11/2026 10:30:00',
        message: 'Dominios listados correctamente',
        data: [EJEMPLO_DOMINIO],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationDominioDto) {
    return this.dominiosService.findAll(paginationDto);
  }

  @Get(':codigo/valores')
  @ApiOperation({
    summary: 'Listar los valores de un dominio por su código',
    description:
      'Atajo para los selectores del frontend: devuelve los valores activos ordenados por `ordenMenu` del dominio indicado (ej. `PAIS`, `MONEDA`, `CASA_CENTRAL`). Permite filtrar por `padreId` y paginar.',
  })
  @ApiParam({
    name: 'codigo',
    description: 'Código del dominio (ej. PAIS, MONEDA).',
    example: 'PAIS',
  })
  @ApiOkResponse({ description: 'Valores del dominio solicitado.' })
  @ApiResponse({
    status: 400,
    description: 'No existe un dominio con ese código.',
  })
  findValoresByCodigo(
    @Param('codigo') codigo: string,
    @Query() paginationDto: PaginationDominioValorDto,
  ) {
    return this.dominioValoresService.findByDominioCodigo(
      codigo,
      paginationDto,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un dominio por su UUID' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del dominio.',
  })
  @ApiOkResponse({
    description: 'Dominio encontrado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'dominios',
        timestamp: '18/11/2026 10:30:00',
        message: 'Dominio encontrado',
        data: EJEMPLO_DOMINIO,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe el dominio.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.dominiosService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('DOMINIO_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar un dominio',
    description:
      'Actualización parcial. Cambiar `codigo` no afecta a los valores porque referencian el dominio por UUID.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del dominio.',
  })
  @ApiOkResponse({ description: 'Dominio actualizado.' })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, no existe el dominio o el código ya está en uso.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateDominioDto,
  ) {
    return this.dominiosService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('DOMINIO_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar un dominio',
    description:
      'Eliminación lógica (soft-delete). Se bloquea si el dominio conserva valores vivos; en ese caso, desactívelo.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del dominio.',
  })
  @ApiOkResponse({ description: 'Dominio eliminado.' })
  @ApiResponse({
    status: 400,
    description:
      'El id no es válido, no existe el dominio o tiene valores asociados.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.dominiosService.remove(id);
  }
}
