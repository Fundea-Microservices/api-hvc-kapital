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
import { ApiKeysService } from './api-keys.service';
import { PaginationActiveDto } from 'src/common/dto/pagination-active.dto';
import { CreateApikeyDto, UpdateApikeyDto } from './dto';

@Controller('auth/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Body() createApikeyDto: CreateApikeyDto) {
    return this.apiKeysService.create(createApikeyDto);
  }

  @Get()
  findAll(@Query() paginationActiveDto: PaginationActiveDto) {
    return this.apiKeysService.findAll(paginationActiveDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApikeyDto: UpdateApikeyDto,
  ) {
    return this.apiKeysService.update(id, updateApikeyDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.remove(id);
  }
}
