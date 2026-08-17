// PartialType se toma de @nestjs/swagger para que los campos heredados
// conserven sus metadatos de @ApiProperty y aparezcan en /v1/docs.
import { PartialType } from '@nestjs/swagger';
import { CreatePuestoDto } from './create-puesto.dto';

export class UpdatePuestoDto extends PartialType(CreatePuestoDto) {}
