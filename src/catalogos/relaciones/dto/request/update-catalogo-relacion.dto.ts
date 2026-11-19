import { PartialType } from '@nestjs/swagger';
import { CreateCatalogoRelacionDto } from './create-catalogo-relacion.dto';

export class UpdateCatalogoRelacionDto extends PartialType(
  CreateCatalogoRelacionDto,
) {}
