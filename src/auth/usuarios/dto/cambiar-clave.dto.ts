import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';

export class CambiarClaveDto {
  @ApiProperty({
    description: 'UUID del usuario que cambia su propia contraseña.',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsUUID()
  usuarioId!: string;

  @ApiProperty({
    description: 'Contraseña actual, necesaria para autorizar el cambio.',
    example: 'Anterior!2025',
    minLength: 4,
    format: 'password',
  })
  @IsString()
  @MinLength(4)
  claveAnterior!: string;

  @ApiProperty({
    description: 'Contraseña nueva que sustituye a la anterior.',
    example: 'S3gura!2026',
    minLength: 4,
    format: 'password',
  })
  @IsString()
  @IsStrongPassword(
    {},
    {
      message:
        'El campo claveNueva no cumple con los requisitos de seguridad. Require al menos una mayúscula, una minúscula, un número y un símbolo.',
    },
  )
  @MinLength(4)
  
  claveNueva!: string;
}
