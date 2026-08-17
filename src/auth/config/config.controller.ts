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
import { ConfigService } from './config.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateConfigDto, UpdateConfigDto } from './dto';

@Controller('auth/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  create(@Body() createDto: CreateConfigDto) {
    return this.configService.create(createDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationActiveDto) {
    return this.configService.findAll(paginationDto);
  }

  @Get('por-llave/:llave')
  findByLlave(@Param('llave') llave: string) {
    return this.configService.findByLlave(llave);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.configService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateConfigDto,
  ) {
    return this.configService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.configService.remove(id);
  }
}
