import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

export class ReorderConfigPoliticaDto {
  @ApiProperty({
    description: 'UUID de la política que se va a reposicionar.',
    example: 'b7e2f8a1-4c3d-4e9b-8a12-9f0c1d2e3f4a',
    format: 'uuid',
  })
  @IsGuid({ message: 'Campo id debe ser un UUID válido.' })
  id!: string;

  @ApiProperty({
    description:
      'Nueva posición (orden) dentro del módulo de la política. ' +
      '0 se interpreta como primera posición. Entero >= 0.',
    example: 2,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'Campo nuevoOrden debe ser un número entero.' })
  @Min(0, { message: 'Campo nuevoOrden debe ser mayor o igual a 0.' })
  nuevoOrden!: number;
}
