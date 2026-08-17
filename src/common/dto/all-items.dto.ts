import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class AllItemsDto {
  @ApiPropertyOptional({
    description: 'Devuelve únicamente los registros activos.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active!: boolean;

  @ApiPropertyOptional({
    description: 'Devuelve únicamente los registros marcados como principales.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  main!: boolean;
}
