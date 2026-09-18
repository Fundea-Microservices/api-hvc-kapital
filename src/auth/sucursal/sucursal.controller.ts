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
import { SucursalService } from './sucursal.service';
import { CreateSucursalDto, UpdateSucursalDto } from './dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminOnly } from 'src/common/decorators/admin.decorator';
import { AdminOnlyGuard } from 'src/common/guards/admin-only.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Sucursales')
@ApiBearerAuth('jwt')
@Controller('auth/sucursal')
export class SucursalController {
  constructor(private readonly sucursalService: SucursalService) {}

  @Post()
  @RequirePermissions('SUCURSAL_CREAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({
    summary: 'Crear una sucursal',
    description: 'Registra una nueva sucursal de la organización.',
  })
  @ApiCreatedResponse({
    description: 'Sucursal creada correctamente.',
    schema: {
      example: {
        success: true, statusCode: '201', path: 'auth/sucursal', timestamp: '16/09/2026 10:30:00',
        message: 'Sucursal creada exitosamente',
        data: { id: 'uuid-sucursal', nombre: 'Sucursal Centro', municipio: 'Guatemala', departamento: 'Guatemala', telefono: '2333-4444', direccion: '6a avenida 12-34', central: false, created_at: '2026-09-16T10:30:00' },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createDto: CreateSucursalDto) {
    return this.sucursalService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar sucursales',
    description: 'Devuelve las sucursales de forma paginada.',
  })
  @ApiOkResponse({
    description: 'Listado de sucursales.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/sucursal', timestamp: '16/09/2026 10:30:00',
        message: 'Sucursales listadas correctamente',
        data: [
          { id: 'uuid-1', nombre: 'Sucursal Centro', municipio: 'Guatemala', departamento: 'Guatemala', central: false },
          { id: 'uuid-2', nombre: 'Sucursal Norte', municipio: 'Mixco', departamento: 'Guatemala', central: true },
        ],
        metadata: { total: 2, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.sucursalService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una sucursal por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la sucursal.' })
  @ApiOkResponse({
    description: 'Sucursal encontrada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/sucursal', timestamp: '16/09/2026 10:30:00',
        message: 'Sucursal encontrada',
        data: { id: 'uuid-sucursal', nombre: 'Sucursal Centro', municipio: 'Guatemala', departamento: 'Guatemala', telefono: '2333-4444', direccion: '6a avenida 12-34', central: false },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe una sucursal con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sucursalService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('SUCURSAL_EDITAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({ summary: 'Actualizar una sucursal' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la sucursal.' })
  @ApiOkResponse({
    description: 'Sucursal actualizada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/sucursal', timestamp: '16/09/2026 10:30:00',
        message: 'Sucursal actualizada exitosamente',
        data: { id: 'uuid-sucursal', nombre: 'Sucursal Centro Actualizada', municipio: 'Guatemala', departamento: 'Guatemala', central: false },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe una sucursal con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSucursalDto,
  ) {
    return this.sucursalService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('SUCURSAL_ELIMINAR')
  @AdminOnly()
  @UseGuards(AdminOnlyGuard)
  @ApiOperation({ summary: 'Eliminar una sucursal' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la sucursal.' })
  @ApiOkResponse({
    description: 'Sucursal eliminada.',
    schema: {
      example: {
        success: true, statusCode: '200', path: 'auth/sucursal', timestamp: '16/09/2026 10:30:00',
        message: 'Sucursal eliminada exitosamente',
        data: { id: 'uuid-sucursal', nombre: 'Sucursal Centro', municipio: 'Guatemala', departamento: 'Guatemala', central: false },
        metadata: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No existe una sucursal con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sucursalService.remove(id);
  }
}
