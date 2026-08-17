import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { toBoolean } from 'src/common/transformers/boolean.transformer';

export class AllItemsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active!: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  main!: boolean;
}
