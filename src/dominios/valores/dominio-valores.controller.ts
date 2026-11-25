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
import { DominioValoresService } from './dominio-valores.service';
import {
  CreateDominioValorDto,
  PaginationDominioValorDto,
  UpdateDominioValorDto,
} from './dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

const EJEMPLO_DOMINIO_VALOR = {
  id: '541de9ac-3b27-4a12-81cf-b2fd83aa6ec7',
  dominioId: '3f46a1f3-1b4d-4b28-bc23-6f1c7ab9e67d',
  padreId: null,
  codigo: 'GT',
  nombre: 'Guatemala',
  valor: '502',
  ordenMenu: 1,
  atributos: { codigoTelefono: '+502', iso3: 'GTM' },
  activo: true,
  created_at: '2026-11-18T10:30:00',
  updated_at: null,
  deleted_at: null,
};

@ApiTags('Dominios - Valores')
@ApiBearerAuth('jwt')
@Controller('dominios/valores')
export class DominioValoresController {
  constructor(private readonly dominioValoresService: DominioValoresService) {}

  @Post()
  @RequirePermissions('DOMINIO_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un valor de dominio',
    description:
      'Registra un valor dentro de un dominio. Si se envía `padreId`, el dominio debe tener `permiteJerarquia = true`, el padre debe pertenecer al mismo dominio y el código no puede repetirse dentro del dominio.',
  })
  @ApiCreatedResponse({
    description: 'Valor creado correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: 'dominios/valores',
        timestamp: '18/11/2026 10:30:00',
        message: 'Valor de dominio creado exitosamente',
        data: EJEMPLO_DOMINIO_VALOR,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, dominio inexistente/inactivo, jerarquía no permitida, padre inválido, código duplicado o JSON mal formado.',
  })
  create(@Body() createDto: CreateDominioValorDto) {
    return this.dominioValoresService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar valores de dominio',
    description:
      'Listado paginado (o completo con `todos=true`) con filtros `dominioId`, `padreId`, `activo` y búsqueda por código, nombre o valor. Ordenado por `ordenMenu` y nombre.',
  })
  @ApiOkResponse({
    description: 'Listado de valores.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'dominios/valores',
        timestamp: '18/11/2026 10:30:00',
        message: 'Valores de dominio listados correctamente',
        data: [EJEMPLO_DOMINIO_VALOR],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationDominioValorDto) {
    return this.dominioValoresService.findAll(paginationDto);
  }

  @Get(':id/arbol')
  @ApiOperation({
    summary: 'Obtener el árbol jerárquico de un valor',
    description:
      'Devuelve el valor solicitado como raíz con todos sus descendientes por `padreId`, ordenados por `ordenMenu` y nombre.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del valor raíz del árbol.',
  })
  @ApiOkResponse({ description: 'Árbol jerárquico del valor.' })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe el valor.',
  })
  findArbol(@Param('id', ParseGuidPipe) id: string) {
    return this.dominioValoresService.findArbol(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un valor de dominio por su UUID' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del valor.',
  })
  @ApiOkResponse({
    description: 'Valor encontrado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'dominios/valores',
        timestamp: '18/11/2026 10:30:00',
        message: 'Valor de dominio encontrado',
        data: EJEMPLO_DOMINIO_VALOR,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El id no es un UUID válido o no existe el valor.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.dominioValoresService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('DOMINIO_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Actualizar un valor de dominio',
    description:
      'Actualización parcial. Cambiar `padreId` revalida jerarquía, pertenencia al dominio y ciclos. Enviar `padreId: null` quita el padre.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del valor.',
  })
  @ApiOkResponse({ description: 'Valor actualizado.' })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, valor/dominio inexistente, dominio inactivo, ciclo jerárquico o código duplicado.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateDominioValorDto,
  ) {
    return this.dominioValoresService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('DOMINIO_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Eliminar un valor de dominio',
    description:
      'Eliminación lógica (soft-delete). Se bloquea si el valor tiene hijos en la jerarquía o relaciones vigentes; en ese caso, desactívelo.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del valor.',
  })
  @ApiOkResponse({ description: 'Valor eliminado.' })
  @ApiResponse({
    status: 400,
    description:
      'El id no es válido, no existe, o el valor tiene hijos o relaciones vigentes.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.dominioValoresService.remove(id);
  }
}
