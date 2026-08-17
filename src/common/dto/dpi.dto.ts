import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class DpiDto {
  @ApiProperty({
    description:
      'Documento Personal de Identificación, exactamente 13 dígitos sin espacios ni guiones.',
    example: 1234567890101,
    minimum: 1000000000000,
    maximum: 9999999999999,
  })
  // @Transform(({ value }) => String(value).replace(/[\s-]/g, '')) // Elimina espacios y guiones
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: 'El DPI debe ser un número entero' },
  )
  @Min(1000000000000, { message: 'El DPI debe tener exactamente 13 dígitos' })
  @Max(9999999999999, { message: 'El DPI debe tener exactamente 13 dígitos' })
  dpi!: number;
}
