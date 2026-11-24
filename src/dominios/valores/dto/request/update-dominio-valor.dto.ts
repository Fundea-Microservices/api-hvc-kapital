import { PartialType } from '@nestjs/swagger';
import { CreateDominioValorDto } from './create-dominio-valor.dto';

export class UpdateDominioValorDto extends PartialType(CreateDominioValorDto) {}
