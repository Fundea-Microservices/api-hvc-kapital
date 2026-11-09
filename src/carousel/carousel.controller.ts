import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CarouselService } from './carousel.service';
import {
  CarouselImagenDto,
  CreateCarouselDto,
  CreateCarouselMultipartDto,
  ObtenerCarouselDto,
  PaginationCarouselDto,
  UpdateCarouselDto,
} from './dto';
import { TempFileCleanupInterceptor } from 'src/storage/interceptors/temp-file-cleanup.interceptor';
import { ParseGuidPipe } from 'src/common/pipes/parse-guid.pipe';

const EJEMPLO_CAROUSEL = {
  carouselId: 'uuid-carousel',
  titulo: 'Nueva tasa preferencial',
  subtitulo: 'Solo durante noviembre',
  codigo: 'PROMO-NOV',
  descripcion: 'Aprovecha la tasa preferencial en créditos personales.',
  fotoUrl: 'storage/carousel/promo-noviembre.jpg',
  redireccionUrl: '/creditos/personales',
  orden: 1,
  visibleWeb: true,
  visibleApp: true,
  usuarios: null,
  textoBoton: 'Ver más',
  fechaInicio: '2026-11-01T00:00:00',
  fechaFin: '2026-11-30T23:59:59',
  esExterno: false,
  activo: true,
  created_at: '2026-09-16T10:30:00',
  updated_at: null,
  deleted_at: null,
};

/**
 * Por ahora cualquier usuario autenticado (JWT, AuthGuard global) puede usar
 * todas las rutas: no llevan @RequirePermissions ni @AdminOnly.
 * Los permisos CAROUSEL_CREAR / CAROUSEL_EDITAR / CAROUSEL_ELIMINAR siguen en
 * el seed para restringirlas más adelante agregando, en cada ruta de escritura:
 *   @RequirePermissions('CAROUSEL_...') @AdminOnly() @UseGuards(AdminOnlyGuard)
 */
@ApiTags('Carousel')
@ApiBearerAuth('jwt')
@Controller('config/carousel')
export class CarouselController {
  constructor(private readonly carouselService: CarouselService) {}

  @Post()
  @UseInterceptors(TempFileCleanupInterceptor, FileInterceptor('file'))
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: CreateCarouselMultipartDto })
  @ApiOperation({
    summary: 'Crear un elemento del carrusel',
    description:
      'Registra una noticia o promoción para el carrusel de la web y/o la app. ' +
      'Se puede enviar como **multipart/form-data** adjuntando la imagen en el campo `file` ' +
      '(JPG/JPEG, PNG, WEBP o GIF, máx. 5MB; se guarda en storage/carousel y su ruta queda en fotoUrl), ' +
      'o como **application/json** indicando una fotoUrl ya existente. Uno de los dos es obligatorio. ' +
      'Si se envían fechaInicio y fechaFin, fechaFin no puede ser anterior a fechaInicio.',
  })
  @ApiCreatedResponse({
    description: 'Elemento creado correctamente.',
    schema: {
      example: {
        success: true,
        statusCode: '201',
        path: 'config/carousel',
        timestamp: '16/09/2026 10:30:00',
        message: 'Elemento del carrusel creado exitosamente',
        data: EJEMPLO_CAROUSEL,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, rango de fechas incorrecto, falta la imagen/fotoUrl o el archivo no es una imagen permitida.',
  })
  @ApiResponse({ status: 413, description: 'La imagen supera los 5MB.' })
  create(
    @Body() createDto: CreateCarouselDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.carouselService.create(createDto, file);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar elementos del carrusel',
    description:
      'Devuelve los elementos de forma paginada, ordenados por `orden` ascendente. ' +
      'Admite búsqueda por título, subtítulo o código y filtros por activo, visibleWeb, visibleApp y vigencia. ' +
      'No incluye los elementos eliminados.',
  })
  @ApiOkResponse({
    description: 'Listado de elementos del carrusel.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config/carousel',
        timestamp: '16/09/2026 10:30:00',
        message: 'Elementos del carrusel listados correctamente',
        data: [EJEMPLO_CAROUSEL],
        metadata: { total: 1, page: 1, limit: 10 },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationCarouselDto) {
    return this.carouselService.findAll(paginationDto);
  }

  // Debe declararse antes de GET :id; si no, "obtener" se toma como un id.
  @Get('obtener')
  @ApiOperation({
    summary: 'Obtener los elementos a mostrar ahora',
    description:
      'Endpoint para la web y la app. Devuelve, sin paginación y ordenados por `orden`, los elementos que cumplen: ' +
      '**activo = true**; **fechaInicio** nula o ya alcanzada; **fechaFin** nula o aún no pasada. ' +
      'Sin `tipoUsuario` solo devuelve los elementos para todos los usuarios (`usuarios` = null); ' +
      'con `tipoUsuario` devuelve además los que incluyen ese código en su lista `usuarios`. ' +
      'No filtra por visibleWeb / visibleApp: ambos campos vienen en la respuesta para que cada consumidor decida.',
  })
  @ApiOkResponse({
    description: 'Elementos vigentes.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config/carousel/obtener',
        timestamp: '16/09/2026 10:30:00',
        message: 'Elementos del carrusel obtenidos correctamente',
        data: [EJEMPLO_CAROUSEL],
        metadata: { total: 1 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'tipoUsuario no es válido (contiene comas o espacios, o es muy largo).',
  })
  obtener(@Query() obtenerDto: ObtenerCarouselDto) {
    return this.carouselService.obtener(obtenerDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un elemento del carrusel por su UUID' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del elemento (carouselId).',
  })
  @ApiOkResponse({
    description: 'Elemento encontrado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config/carousel',
        timestamp: '16/09/2026 10:30:00',
        message: 'Elemento del carrusel encontrado',
        data: EJEMPLO_CAROUSEL,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'El id no es un UUID válido o no existe un elemento con ese id.',
  })
  findOne(@Param('id', ParseGuidPipe) id: string) {
    return this.carouselService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar un elemento del carrusel',
    description:
      'Actualización parcial: solo se modifican los campos enviados. Enviar null limpia un campo opcional.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del elemento (carouselId).',
  })
  @ApiOkResponse({
    description: 'Elemento actualizado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config/carousel',
        timestamp: '16/09/2026 10:30:00',
        message: 'Elemento del carrusel actualizado exitosamente',
        data: {
          ...EJEMPLO_CAROUSEL,
          orden: 2,
          updated_at: '2026-09-17T08:00:00',
        },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cuerpo inválido, rango de fechas incorrecto o no existe un elemento con ese id.',
  })
  update(
    @Param('id', ParseGuidPipe) id: string,
    @Body() updateDto: UpdateCarouselDto,
  ) {
    return this.carouselService.update(id, updateDto);
  }

  @Put(':id/imagen')
  @UseInterceptors(TempFileCleanupInterceptor, FileInterceptor('file'))
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CarouselImagenDto })
  @ApiOperation({
    summary: 'Cargar o cambiar la imagen de un elemento del carrusel',
    description:
      'Sube la imagen a la categoría `carousel` del módulo de storage y actualiza fotoUrl con la nueva ruta. ' +
      'Formatos permitidos: JPG/JPEG, PNG, WEBP y GIF (máx. 5MB); se valida MIME, extensión y contenido real (magic number). ' +
      'La imagen anterior se borra del disco si estaba en storage/carousel y ningún otro elemento la usa. ' +
      'La imagen se descarga con GET /storage/carousel/{fileName}.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del elemento (carouselId).',
  })
  @ApiOkResponse({
    description: 'Imagen actualizada.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config/carousel',
        timestamp: '16/09/2026 10:30:00',
        message: 'Imagen del carrusel actualizada exitosamente',
        data: {
          ...EJEMPLO_CAROUSEL,
          fotoUrl: 'storage/carousel/banner_diciembre-1794211200000.webp',
          updated_at: '2026-09-17T08:00:00',
        },
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'No se adjuntó archivo, el archivo no es una imagen permitida, el id no es válido o no existe.',
  })
  @ApiResponse({ status: 413, description: 'La imagen supera los 5MB.' })
  cambiarImagen(
    @Param('id', ParseGuidPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.carouselService.cambiarImagen(id, file);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un elemento del carrusel',
    description:
      'Eliminación lógica (soft-delete): se llena deleted_at y el elemento deja de listarse.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID del elemento (carouselId).',
  })
  @ApiOkResponse({
    description: 'Elemento eliminado.',
    schema: {
      example: {
        success: true,
        statusCode: '200',
        path: 'config/carousel',
        timestamp: '16/09/2026 10:30:00',
        message: 'Elemento del carrusel eliminado exitosamente',
        data: EJEMPLO_CAROUSEL,
        metadata: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'El id no es un UUID válido o no existe un elemento con ese id.',
  })
  remove(@Param('id', ParseGuidPipe) id: string) {
    return this.carouselService.remove(id);
  }
}
