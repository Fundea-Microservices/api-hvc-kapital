// PartialType se toma de @nestjs/swagger para que los campos heredados
// conserven sus metadatos de @ApiProperty y aparezcan en /v1/docs.
import { PartialType } from '@nestjs/swagger';
import { CreateConfigModuloDto } from './create-config-modulo.dto';

export class UpdateConfigModuloDto extends PartialType(CreateConfigModuloDto) {}
