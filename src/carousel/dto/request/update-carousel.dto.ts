// PartialType se toma de @nestjs/swagger para que los campos heredados
// conserven sus metadatos de @ApiProperty y aparezcan en /v1/docs.
import { PartialType } from '@nestjs/swagger';
import { CreateCarouselDto } from './create-carousel.dto';

export class UpdateCarouselDto extends PartialType(CreateCarouselDto) {}
