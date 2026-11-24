// PartialType se toma de @nestjs/swagger para conservar los metadatos de
// @ApiProperty en /v1/docs.
import { PartialType } from '@nestjs/swagger';
import { CreateDominioDto } from './create-dominio.dto';

export class UpdateDominioDto extends PartialType(CreateDominioDto) {}
