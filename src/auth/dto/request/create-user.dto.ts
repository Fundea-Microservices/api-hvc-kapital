import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario; debe ser único.',
    example: 'jperez@fundea.org.gt',
    format: 'email',
  })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Contraseña robusta: al menos una mayúscula, una minúscula, un número y un símbolo.',
    example: 'S3gura!2026',
    format: 'password',
  })
  @IsString()
  @IsStrongPassword()
  password!: string;

  @ApiPropertyOptional({
    description: 'Nombre completo ya armado. Si se omite, se compone de las partes.',
    example: 'Juan Carlos Pérez López',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: 'Primer nombre. Se normaliza a capitalización inicial.',
    example: 'Juan',
  })
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name1!: string;

  @ApiPropertyOptional({
    description: 'Segundo nombre.',
    example: 'Carlos',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  name2?: string;

  @ApiPropertyOptional({
    description: 'Tercer nombre.',
    example: 'Andrés',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  name3?: string;

  @ApiProperty({
    description: 'Primer apellido. Se normaliza a capitalización inicial.',
    example: 'Pérez',
  })
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  lastName1!: string;

  @ApiPropertyOptional({
    description: 'Segundo apellido.',
    example: 'López',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  lastName2?: string;

  @ApiPropertyOptional({
    description: 'Apellido de casada u otro tercer apellido.',
    example: 'de Morales',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  lastName3?: string;

  @ApiProperty({
    description: 'Nombre de usuario para iniciar sesión. Se guarda en minúsculas.',
    example: 'jperez',
  })
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  userName!: string;

  @ApiPropertyOptional({
    description: 'UUID del puesto asignado.',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  puestoId?: string;

  @ApiPropertyOptional({
    description: 'UUID del rol asignado.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  rolId?: string;

  @ApiPropertyOptional({
    description: 'Fecha del último cambio de contraseña, en UTC.',
    example: '2026-08-17T15:59:52.000Z',
    type: Date,
  })
  @IsDate()
  @IsOptional()
  lastPasswordUpdate?: Date;

  @ApiPropertyOptional({
    description: 'URL de la fotografía de perfil.',
    example: 'https://cdn.hvckapital.com/perfiles/jperez.jpg',
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Huella digital registrada para autenticación biométrica.',
  })
  @IsString()
  @IsOptional()
  fingerprint?: string;

  @ApiPropertyOptional({
    description: 'Exige validar la dirección MAC del equipo al iniciar sesión.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  validateMAC?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si la cuenta está habilitada.',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

function capitalizeFirstLetter(value: string): string {
  if (typeof value !== 'string') return value;
  value = value.trim().toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
