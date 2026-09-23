import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
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
    minLength: 4,
    format: 'password',
  })
  @IsString()
  @MinLength(4)
  claveNueva!: string;
}
