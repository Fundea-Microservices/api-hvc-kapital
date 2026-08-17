import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateRolDto } from './create-rol.dto';

// Hereda de CreateRolDto, así que 'nombre' sigue siendo obligatorio al
// actualizar. Añade los campos que solo tienen sentido sobre un rol existente.
export class UpdateRolDto extends CreateRolDto {
  @ApiPropertyOptional({
    description: 'UUID del rol que se actualiza.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  rolId?: string;

  @ApiPropertyOptional({
    description:
      'Concede al rol privilegios de administrador sobre todo el sistema.',
    example: false,
  })
  @IsBoolean({ message: 'Campo esAdmin debe ser un valor booleano.' })
  @IsOptional()
  esAdmin?: boolean;

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
    description: 'Fecha de baja lógica, en UTC. Nulo si el rol sigue vigente.',
    example: null,
  })
  @IsString({ message: 'Campo deleted_at debe ser un string.' })
  @IsOptional()
  deleted_at?: string;
}
