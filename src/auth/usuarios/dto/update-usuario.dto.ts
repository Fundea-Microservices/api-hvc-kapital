import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto';

// Hereda de CreateUsuarioDto, así que los campos obligatorios del alta
// (nombre1, apellido1, userName, correo, rolId) siguen siéndolo al
// actualizar. Añade los campos propios de un registro ya existente.
export class UpdateUsuarioDto extends CreateUsuarioDto {
  @ApiPropertyOptional({
    description: 'UUID del usuario que se actualiza.',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  usuarioId!: string;

  @ApiPropertyOptional({
    description: 'Fecha de creación del registro, en UTC.',
    example: '2026-08-17T15:59:52.000Z',
  })
  @IsString({ message: 'Campo created_at debe ser un string.' })
  @IsOptional()
  created_at?: string;

  @ApiPropertyOptional({
    description: 'Fecha de la última modificación, en UTC.',
    example: '2026-08-17T15:59:52.000Z',
  })
  @IsString({ message: 'Campo updated_at debe ser un string.' })
  @IsOptional()
  updated_at?: string;

  @ApiPropertyOptional({
    description:
      'Fecha de baja lógica, en UTC. Nulo si el usuario sigue vigente.',
    example: null,
  })
  @IsString({ message: 'Campo deleted_at debe ser un string.' })
  @IsOptional()
  deleted_at?: string;
}
