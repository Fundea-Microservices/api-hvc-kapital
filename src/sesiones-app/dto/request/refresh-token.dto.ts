import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

// Cuerpo de /auth/refresh y /auth/logout: la app manda solo el refresh token.
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token entregado al registrar la sesion.',
    example: 'a3f1c9...64 caracteres hexadecimales',
  })
  @IsString()
  @Length(64, 64, { message: 'El refresh token no tiene el formato esperado.' })
  refreshToken!: string;
}
