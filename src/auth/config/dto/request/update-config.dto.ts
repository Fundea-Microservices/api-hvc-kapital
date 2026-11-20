// PartialType se toma de @nestjs/swagger para que los campos heredados
// conserven sus metadatos de @ApiProperty y aparezcan en /v1/docs.
// La actualización es parcial: `PATCH /auth/config/:id` solo exige los campos
// que se envían, e incluye `politicaId` opcional para reasignar la política.
import { PartialType } from '@nestjs/swagger';
import { CreateConfigDto } from './create-config.dto';

export class UpdateConfigDto extends PartialType(CreateConfigDto) {}
