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
import { ApiKeysService } from './api-keys.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateApikeyDto, UpdateApikeyDto } from './dto';

@ApiTags('Llaves de API')
@ApiBearerAuth('jwt')
@Controller('auth/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una llave de API',
    description:
      'Da de alta una llave para que un sistema externo consuma la API sin usuario interactivo.',
  })
  @ApiResponse({ status: 201, description: 'Llave creada correctamente.' })
  @ApiResponse({ status: 400, description: 'El cuerpo enviado no es válido.' })
  create(@Body() createApikeyDto: CreateApikeyDto) {
    return this.apiKeysService.create(createApikeyDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar llaves de API',
    description: 'Devuelve las llaves registradas de forma paginada.',
  })
  @ApiResponse({ status: 200, description: 'Listado de llaves.' })
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.apiKeysService.findAll(paginationActiveDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una llave por su UUID' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la llave.' })
  @ApiResponse({ status: 200, description: 'Llave encontrada.' })
  @ApiResponse({ status: 400, description: 'El id no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'No existe una llave con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una llave de API' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la llave.' })
  @ApiResponse({ status: 200, description: 'Llave actualizada.' })
  @ApiResponse({ status: 404, description: 'No existe una llave con ese id.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApikeyDto: UpdateApikeyDto,
  ) {
    return this.apiKeysService.update(id, updateApikeyDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una llave de API',
    description: 'Revoca la llave: los sistemas que la usen dejarán de autenticarse.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID de la llave.' })
  @ApiResponse({ status: 200, description: 'Llave eliminada.' })
  @ApiResponse({ status: 404, description: 'No existe una llave con ese id.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.remove(id);
  }
}
