import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, MinLength } from 'class-validator';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

export class ResetClaveDto {
  @ApiProperty({
    description:
      'UUID del usuario al que se le restablece la contraseña. Operación de administrador: no pide la clave anterior.',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsGuid()
  usuarioId!: string;

@ApiProperty({
    description: 'Contraseña nueva asignada al usuario.',
    example: 'Temporal!2026',
    minLength: 6,
    format: 'password',
  })
  @IsString()
  @IsStrongPassword(
    { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    {
      message:
        'La nueva contraseña debe ser segura: mínimo 6 caracteres y contener al menos una mayúscula, una minúscula, un número y un símbolo especial.',
    },
  )
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  claveNueva!: string;
}
