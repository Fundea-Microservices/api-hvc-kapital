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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateConfigDto, UpdateConfigDto } from './dto';

@ApiTags('Configuración')
@ApiBearerAuth('jwt')
@Controller('auth/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un parámetro de configuración',
    description:
      'Registra un par llave/valor con el tipo al que debe convertirse al leerlo.',
  })
  @ApiResponse({ status: 201, description: 'Parámetro creado correctamente.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createDto: CreateConfigDto) {
    return this.configService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar parámetros de configuración',
    description: 'Devuelve los parámetros de forma paginada.',
  })
  @ApiResponse({ status: 200, description: 'Listado de parámetros.' })
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
  @ApiResponse({ status: 200, description: 'Parámetro encontrado.' })
  @ApiResponse({ status: 404, description: 'No existe esa llave.' })
  findByLlave(@Param('llave') llave: string) {
    return this.configService.findByLlave(llave);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un parámetro por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del parámetro.' })
  @ApiResponse({ status: 200, description: 'Parámetro encontrado.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe un parámetro con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.configService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un parámetro de configuración' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del parámetro.' })
  @ApiResponse({ status: 200, description: 'Parámetro actualizado.' })
  @ApiResponse({ status: 404, description: 'No existe un parámetro con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateConfigDto,
  ) {
    return this.configService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un parámetro de configuración' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID del parámetro.' })
  @ApiResponse({ status: 200, description: 'Parámetro eliminado.' })
  @ApiResponse({ status: 404, description: 'No existe un parámetro con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.configService.remove(id);
  }
}
