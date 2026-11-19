// PartialType se toma de @nestjs/swagger para conservar los metadatos de
// @ApiProperty en /v1/docs.
import { PartialType } from '@nestjs/swagger';
import { CreateCatalogoTipoDto } from './create-catalogo-tipo.dto';

export class UpdateCatalogoTipoDto extends PartialType(CreateCatalogoTipoDto) {}
