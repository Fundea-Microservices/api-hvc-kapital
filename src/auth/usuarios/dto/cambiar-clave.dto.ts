import { IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';

export class CambiarClaveDto {
  @IsUUID()
  usuarioId!: string;

  @IsString()
  @MinLength(4)
  claveAnterior!: string;

  @IsString()
  // @IsStrongPassword(
  //   {},
  //   {
  //     message:
  //       'El campo claveNueva no cumple con los requisitos de seguridad. Require al menos una mayúscula, una minúscula, un número y un símbolo.',
  //   },
  // )
  @MinLength(4)
  claveNueva!: string;
}
