// PartialType se toma de @nestjs/swagger para que los campos heredados
// conserven sus metadatos de @ApiProperty y aparezcan en /v1/docs.
import { PartialType } from '@nestjs/swagger';
import { CreateConfigPoliticaDto } from './create-config-politica.dto';

export class UpdateConfigPoliticaDto extends PartialType(
  CreateConfigPoliticaDto,
) {}
