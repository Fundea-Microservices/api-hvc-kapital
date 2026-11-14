import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

/**
 * Conjunto EXACTO de caracteres especiales admitidos. Debe coincidir con
 * `politicaPassword.ts` de la app movil, que lo valida mientras se teclea.
 */
const CARACTERES_ESPECIALES = '@#$%*!?&';

export class CambiarClaveDto {
  @ApiPropertyOptional({
    description:
      'Se acepta por compatibilidad con la app, pero se IGNORA: el usuario ' +
      'se toma del token JWT para que nadie cambie la clave de otro.',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsOptional()
  @IsGuid()
  usuarioId?: string;

  @ApiProperty({
    description: 'Contraseña actual, necesaria para autorizar el cambio.',
    example: 'Anterior!2025',
    format: 'password',
  })
  @IsString()
  @MinLength(4)
  claveAnterior!: string;

  @ApiProperty({
    description:
      'Contraseña nueva: 8 a 20 caracteres, con mayúscula, minúscula, ' +
      `número y uno de ${CARACTERES_ESPECIALES}.`,
    example: 'S3gura!2026',
    minLength: 8,
    maxLength: 20,
    format: 'password',
  })
  @IsString()
  @Length(8, 20, {
    message: 'La nueva contraseña debe tener entre 8 y 20 caracteres.',
  })
  @Matches(/[A-Z]/, {
    message: 'La nueva contraseña debe incluir al menos una mayúscula.',
  })
  @Matches(/[a-z]/, {
    message: 'La nueva contraseña debe incluir al menos una minúscula.',
  })
  @Matches(/[0-9]/, {
    message: 'La nueva contraseña debe incluir al menos un número.',
  })
  @Matches(/[@#$%*!?&]/, {
    message: `La nueva contraseña debe incluir al menos uno de: ${CARACTERES_ESPECIALES}`,
  })
  claveNueva!: string;
}
