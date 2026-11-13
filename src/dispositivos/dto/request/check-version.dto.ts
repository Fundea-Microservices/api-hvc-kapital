import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CheckVersionDto {
  @ApiProperty({
    description: 'Version instalada de la app, en formato x.y.z.',
    example: '1.4.0',
  })
  @IsString()
  @Matches(/^\d+(\.\d+)*$/, {
    message: 'appVersion debe tener el formato x.y.z.',
  })
  appVersion!: string;
}
