import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  isUUID,
  IsUUID,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @IsStrongPassword()
  password!: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name1!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  name2?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  name3?: string;

  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  lastName1!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  lastName2?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? capitalizeFirstLetter(value) : value))
  lastName3?: string;

  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  userName!: string;

  @IsUUID()
  @IsOptional()
  puestoId?: string;

  @IsUUID()
  @IsOptional()
  rolId?: string;

  @IsDate()
  @IsOptional()
  lastPasswordUpdate?: Date;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  fingerprint?: string;

  @IsBoolean()
  @IsOptional()
  validateMAC?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

function capitalizeFirstLetter(value: string): string {
  if (typeof value !== 'string') return value;
  value = value.trim().toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
