import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { StorageService } from '../services/storage.service';
import { UploadFileDto } from '../dto/upload-file.dto';
import { CategoryAccessGuard } from '../guards/category-access.guard';
import { FileLoggingInterceptor } from '../interceptors/file-logging.interceptor';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Usuario } from 'database/entities/usuario.entity';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Storage')
@ApiBearerAuth('jwt')
@Controller('storage')
@UseGuards(AuthGuard)
@UseInterceptors(FileLoggingInterceptor)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/:categoria')
  @UseGuards(CategoryAccessGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Subir archivo a una categoría específica' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'categoria',
    enum: ['perfil', 'producto', 'porcion', 'solicitud', 'documento'],
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        customName: { type: 'string' },
        metadata: { type: 'object' },
      },
    },
  })
  async uploadFile(
    @Param('categoria') categoria: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @GetUser() user: Usuario,
  ) {
    return this.storageService.uploadFile({
      file,
      categoria,
      customName: dto.customName,
      metadata: dto.metadata,
      userId: user.id,
    });
  }

  @Get(':categoria/:fileName')
  @Throttle({ medium: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Descargar archivo por categoría y nombre' })
  @ApiParam({
    name: 'categoria',
    enum: ['perfil', 'producto', 'solicitud', 'porcion', 'documento'],
  })
  @ApiParam({ name: 'fileName', description: 'Nombre del archivo' })
  async downloadFile(
    @Param('categoria') categoria: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    return this.storageService.downloadFile(categoria, fileName, res);
  }
}
