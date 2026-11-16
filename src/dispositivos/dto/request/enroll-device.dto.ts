import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class EnrollDeviceDto {
  @ApiProperty({
    description:
      'Codigo de enrolamiento del usuario (auth.Usuario.CodigoEnrolamiento).',
    example: 'HVC-2026-0001',
    minLength: 5,
  })
  @IsString()
  @MinLength(5, { message: 'El codigo de enrolamiento es muy corto.' })
  @MaxLength(50, { message: 'El codigo de enrolamiento es muy largo.' })
  codigoEnrolamiento!: string;

  @ApiProperty({
    description: 'Identificador fisico del equipo; inmutable tras el registro.',
    example: 'a1b2c3d4e5f6a7b8',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'HardwareID invalido.' })
  @MaxLength(100, { message: 'HardwareID invalido.' })
  hardwareId!: string;
}
