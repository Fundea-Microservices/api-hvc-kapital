import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class DpiDto {
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
