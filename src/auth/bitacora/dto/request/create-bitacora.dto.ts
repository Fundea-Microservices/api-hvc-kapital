import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { IsGuid } from 'src/common/validators/is-guid.decorator';

export class CreateBitacoraDto {
  @ApiProperty({
    description: 'Ruta del endpoint que se está autorizando.',
    example: 'POST /v1/auth/usuarios',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'El campo endpoint debe ser una cadena de texto' })
  @MinLength(1, { message: 'El campo endpoint debe tener al menos 1 caracter' })
  @MaxLength(100, { message: 'El campo endpoint no puede exceder 100 caracteres' })
  endpoint!: string;

  @ApiProperty({
    description: 'Cuerpo completo de la petición HTTP original (JSON serializado).',
    example: '{"nombre1":"Juan","apellido1":"Perez","rolId":"550e8400-..."}',
  })
  @IsString({ message: 'El campo body_request debe ser una cadena de texto' })
  body_request!: string;

  @ApiProperty({
    description: 'UUID del usuario que está solicitando la autorización.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsGuid({ message: 'El campo solicitanteId debe ser un UUID válido' })
  solicitanteId!: string;

  @ApiProperty({
    description: 'UUID del usuario que debe aprobar la solicitud.',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsGuid({ message: 'El campo autorizadorId debe ser un UUID válido' })
  autorizadorId!: string;

  @ApiProperty({
    description: 'UUID del permiso requerido para autorizar.',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsGuid({ message: 'El campo permisoId debe ser un UUID válido' })
  permisoId!: string;
}
