import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

export class ReorderAccesoDto {
  @ApiProperty({
    description: 'UUID del acceso que se va a reposicionar.',
    example: '99b437ef-0721-4f09-a20b-ceea6138c321',
    format: 'uuid',
  })
  @IsGuid({ message: 'Campo id debe ser un UUID válido.' })
  id!: string;

  @ApiProperty({
    description:
      'Nueva posición (ordenMenu) dentro de la misma rama (mismo rolId y mainMenuId). Entero >= 0.',
    example: 2,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'Campo nuevoOrden debe ser un número entero.' })
  @Min(0, { message: 'Campo nuevoOrden debe ser mayor o igual a 0.' })
  nuevoOrden!: number;
}
