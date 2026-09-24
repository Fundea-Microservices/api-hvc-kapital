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
import { ConfigService } from './config.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateConfigDto, UpdateConfigDto } from './dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

@ApiTags('Configuración')
@ApiBearerAuth('jwt')
@Controller('auth/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @RequirePermissions('CONFIG_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear un parámetro de configuración',
    description:
      'Registra un par llave/valor con el tipo al que debe convertirse al leerlo.',
  })
  @ApiCreatedResponse({
    description: 'Parámetro creado correctamente.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/config', timestamp: '16/09/2026 10:30:00',
        message: 'Configuración creada exitosamente',
        data: { id: 'uuid-config', llave: 'DIAS_VENCIMIENTO_CLAVE', valor: '90', tipo: 'number', descripcion: 'Días antes de que expire la contraseña', activo: true, created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createDto: CreateConfigDto) {
    return this.configService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar parámetros de configuración',
    description: 'Devuelve los parámetros de forma paginada.',
  })
  @ApiOkResponse({
    description: 'Listado de parámetros.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/config', timestamp: '16/09/2026 10:30:00',
        message: 'Configuraciones listadas correctamente',
        data: [
          { id: 'uuid-1', llave: 'DIAS_VENCIMIENTO_CLAVE', valor: '90', tipo: 'number', descripcion: 'Días antes de que expire la contraseña', activo: true },
        ],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationActiveDto) {
    return this.configService.findAll(paginationDto);
  }

  @Get('por-llave/:llave')
  @ApiOperation({
    summary: 'Consultar un parámetro por su llave',
    description:
      'Busca por el nombre de la llave en lugar del UUID. Útil cuando el consumidor conoce el nombre del parámetro pero no su id.',
  })
  @ApiParam({
    name: 'llave',
    description: 'Nombre de la llave.',
    example: 'DIAS_VENCIMIENTO_CLAVE',
  })
  @ApiOkResponse({
    description: 'Parámetro encontrado por llave.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/config', timestamp: '16/09/2026 10:30:00',
        message: 'Configuración encontrada',
        data: { id: 'uuid-config', llave: 'DIAS_VENCIMIENTO_CLAVE', valor: '90', tipo: 'number', descripcion: 'Días antes de que expire la contraseña', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe esa llave.' })
  findByLlave(@Param('llave') llave: string) {
    return this.configService.findByLlave(llave);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un parámetro por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del parámetro.' })
  @ApiOkResponse({
    description: 'Parámetro encontrado por UUID.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/config', timestamp: '16/09/2026 10:30:00',
        message: 'Configuración encontrada',
        data: { id: 'uuid-config', llave: 'DIAS_VENCIMIENTO_CLAVE', valor: '90', tipo: 'number', descripcion: 'Días antes de que expire la contraseña', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un parámetro con ese id.' })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.configService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('CONFIG_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({ summary: 'Actualizar un parámetro de configuración' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del parámetro.' })
  @ApiOkResponse({
    description: 'Parámetro actualizado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/config', timestamp: '16/09/2026 10:30:00',
        message: 'Configuración actualizada exitosamente',
        data: { id: 'uuid-config', llave: 'DIAS_VENCIMIENTO_CLAVE', valor: '120', tipo: 'number', descripcion: 'Días antes de que expire la contraseña', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un parámetro con ese id.' })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateConfigDto,
  ) {
    return this.configService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIG_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({ summary: 'Eliminar un parámetro de configuración' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del parámetro.' })
  @ApiOkResponse({
    description: 'Parámetro eliminado.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/config', timestamp: '16/09/2026 10:30:00',
        message: 'Configuración eliminada exitosamente',
        data: { id: 'uuid-config', llave: 'DIAS_VENCIMIENTO_CLAVE', valor: '90', tipo: 'number', activo: true },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe un parámetro con ese id.' })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.configService.remove(id);
  }
}
