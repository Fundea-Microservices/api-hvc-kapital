// PartialType se toma de @nestjs/swagger y no de @nestjs/mapped-types: la
// versión de swagger hereda además los metadatos de @ApiProperty, así que los
// campos aparecen documentados (y como opcionales) en /v1/docs.
import { PartialType } from '@nestjs/swagger';
import { CreateAccesoDto } from './create-acceso.dto';

export class UpdateAccesoDto extends PartialType(CreateAccesoDto) {}
