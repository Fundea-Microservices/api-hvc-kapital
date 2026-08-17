import { Controller, Get, Post, Body, Param, Delete, Query, ParseUUIDPipe, Put } from '@nestjs/common';
import { CategoriasInsumoService } from './services/categorias-insumo.service';
import { InsumosService } from './services/insumos.service';
import { MovimientosInsumoService } from './services/movimientos-insumo.service';
import { CreateCategoriaInsumoDto, UpdateCategoriaInsumoDto } from './dto/categoria-insumo.dto';
import { CreateInsumoDto, PaginationInsumoDto, UpdateInsumoDto } from './dto/insumo.dto';
import { CreateMovimientoInsumoDto } from './dto/movimiento-insumo.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('bodega')
export class BodegaController {
  constructor(
    private readonly categoriasService: CategoriasInsumoService,
    private readonly insumosService: InsumosService,
    private readonly movimientosService: MovimientosInsumoService,
  ) {}

  // --- CATEGORIAS INSUMO ---
  @Post('categoria')
  createCategoria(@Body() createDto: CreateCategoriaInsumoDto) {
    return this.categoriasService.create(createDto);
  }

  @Get('categoria')
  findAllCategorias(@Query() paginationDto: PaginationDto) {
    return this.categoriasService.findAll(paginationDto);
  }

  @Get('categoria/:id')
  findOneCategoria(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasService.findOne(id);
  }

  @Put('categoria/:id')
  updateCategoria(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateCategoriaInsumoDto) {
    console.log("🚀 ~ BodegaController ~ updateCategoria ~ id:", id)
    return this.categoriasService.update(id, updateDto);
  }

  @Delete('categoria/:id')
  removeCategoria(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasService.remove(id);
  }

  // --- INSUMOS ---
  @Post('insumo')
  createInsumo(@Body() createDto: CreateInsumoDto) {
    return this.insumosService.create(createDto);
  }

  @Get('insumo')
  findAllInsumos(@Query() paginationDto: PaginationInsumoDto) {
    return this.insumosService.findAll(paginationDto);
  }

  @Get('insumo/:id')
  findOneInsumo(@Param('id', ParseUUIDPipe) id: string) {
    return this.insumosService.findOne(id);
  }

  @Put('insumo/:id')
  updateInsumo(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateInsumoDto) {
    return this.insumosService.update(id, updateDto);
  }

  @Delete('insumo/:id')
  removeInsumo(@Param('id', ParseUUIDPipe) id: string) {
    return this.insumosService.remove(id);
  }

  // --- MOVIMIENTOS INSUMO ---
  @Post('movimiento-insumo')
  createMovimiento(@Body() createDto: CreateMovimientoInsumoDto, @GetUser('id') usuarioId: string) {
    return this.movimientosService.create(createDto, usuarioId);
  }

  @Get('movimiento-insumo')
  findAllMovimientos(@Query() paginationDto: PaginationDto) {
    return this.movimientosService.findAll(paginationDto);
  }

  @Get('movimiento-insumo/:insumoId')
  findByInsumo(@Param('insumoId', ParseUUIDPipe) insumoId: string, @Query() paginationDto: PaginationDto) {
    return this.movimientosService.findByInsumo(insumoId, paginationDto);
  }
}
