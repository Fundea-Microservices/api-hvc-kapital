import { IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermisoUsuarioDto {
  @ApiProperty({ description: 'UUID del usuario', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('all', { message: 'El usuarioId debe ser un UUID válido' })
  usuarioId!: string;

  @ApiProperty({ description: 'UUID del permiso', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID('all', { message: 'El permisoId debe ser un UUID válido' })
  permisoId!: string;

  @ApiPropertyOptional({ description: 'Indica si el permiso está concedido al usuario', example: true, default: true })
  @IsBoolean({ message: 'El campo permitido debe ser un booleano' })
  @IsOptional()
  permitido?: boolean;
}

export class UpdatePermisoUsuarioDto {
  @ApiProperty({ description: 'Indica si el permiso está concedido al usuario', example: false })
  @IsBoolean({ message: 'El campo permitido debe ser un booleano' })
  permitido!: boolean;
}
