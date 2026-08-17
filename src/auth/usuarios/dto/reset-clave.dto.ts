import { IsString, IsUUID, MinLength } from 'class-validator';

export class ResetClaveDto {
  @IsUUID()
  usuarioId!: string;

  @IsString()
  @MinLength(4)
  claveNueva!: string;
}
