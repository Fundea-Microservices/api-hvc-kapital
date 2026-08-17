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
import { PuestosService } from './puestos.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreatePuestoDto, UpdatePuestoDto } from './dto';

@Controller('auth/puestos')
export class PuestosController {
  constructor(private readonly puestosService: PuestosService) {}

  @Post()
  create(@Body() createPuestoDto: CreatePuestoDto) {
    return this.puestosService.create(createPuestoDto);
  }

  @Get()
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.puestosService.findAll(paginationActiveDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.puestosService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePuestoDto: UpdatePuestoDto,
  ) {
    return this.puestosService.update(id, updatePuestoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.puestosService.remove(id);
  }
}
