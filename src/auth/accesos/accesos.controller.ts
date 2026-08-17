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
import { AccesosService } from './accesos.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateAccesoDto, UpdateAccesoDto } from './dto';

@Controller('auth/accesos')
export class AccesosController {
  constructor(private readonly accesosService: AccesosService) { }

  @Post()
  create(@Body() createAccesoDto: CreateAccesoDto) {
    return this.accesosService.create(createAccesoDto);
  }

  @Get()
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.accesosService.findAll(paginationActiveDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.accesosService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccesoDto: UpdateAccesoDto,
  ) {
    return this.accesosService.update(id, updateAccesoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.accesosService.remove(id);
  }

  // ACCESO

  @Get(':id/rol')
  findOneByRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.accesosService.findAccesoByRol(id);
  }
}
