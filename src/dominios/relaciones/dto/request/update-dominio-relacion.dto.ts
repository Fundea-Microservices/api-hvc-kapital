import { PartialType } from '@nestjs/swagger';
import { CreateDominioRelacionDto } from './create-dominio-relacion.dto';

export class UpdateDominioRelacionDto extends PartialType(
  CreateDominioRelacionDto,
) {}
