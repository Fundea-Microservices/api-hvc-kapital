import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class ObtenerCarouselDto {
  @ApiPropertyOptional({
    description:
      'Código de usuario a buscar dentro de la lista `usuarios` del elemento. ' +
      'Sin valor: solo se devuelven los elementos para todos los usuarios (usuarios = null). ' +
      'Con valor: se devuelven los elementos para todos más los que incluyen ese código.',
    example: 'jperez',
    maxLength: 100,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString({ message: 'Campo tipoUsuario debe ser una cadena de texto.' })
  @MaxLength(100, {
    message: 'Campo tipoUsuario no puede exceder 100 caracteres.',
  })
  @Matches(/^[^,\s]+$/, {
    message: 'Campo tipoUsuario no puede contener comas ni espacios.',
  })
  @IsOptional()
  tipoUsuario?: string;
}
