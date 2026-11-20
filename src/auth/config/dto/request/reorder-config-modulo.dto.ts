import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

export class ReorderConfigModuloDto {
  @ApiProperty({
    description: 'UUID del módulo que se va a reposicionar.',
    example: 'a1b2c3d4-e5f6-4789-9012-3456789abcde',
    format: 'uuid',
  })
  @IsGuid({ message: 'Campo id debe ser un UUID válido.' })
  id!: string;

  @ApiProperty({
    description:
      'Nueva posición (orden) dentro del listado global de módulos. ' +
      '0 se interpreta como primera posición. Entero >= 0.',
    example: 2,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'Campo nuevoOrden debe ser un número entero.' })
  @Min(0, { message: 'Campo nuevoOrden debe ser mayor o igual a 0.' })
  nuevoOrden!: number;
}
