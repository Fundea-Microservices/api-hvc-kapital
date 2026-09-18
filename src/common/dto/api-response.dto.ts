import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO genérico que representa la estructura estándar de respuesta
 * de la API, replicando el formato de BaseService.customSuccessResponse.
 *
 * Uso en controladores:
 *   @ApiOkResponse({ type: ApiResponseDto, description: '...' })
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({ description: 'Indica si la operación fue exitosa.', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Código HTTP de la operación.', example: '200' })
  statusCode!: string;

  @ApiProperty({ description: 'Ruta del endpoint que respondió.', example: 'auth/usuarios' })
  path!: string;

  @ApiProperty({ description: 'Timestamp de la respuesta en horario de Guatemala (DD/MM/YYYY HH:mm:ss).', example: '16/09/2026 10:30:00' })
  timestamp!: string;

  @ApiProperty({ description: 'Mensaje descriptivo del resultado.', example: 'Operación exitosa' })
  message!: string;

  @ApiPropertyOptional({ description: 'Datos de la operación. Puede ser un objeto, un arreglo o null.' })
  data?: T;

  @ApiPropertyOptional({
    description: 'Metadatos de paginación. Presente solo en listados.',
    nullable: true,
    example: { total: 150, page: 1, limit: 10 },
  })
  metadata?: { total: number; page: number; limit: number } | null;
}

/**
 * DTO de respuesta para errores.
 * Replica la estructura que lanza BaseService.customThrowError.
 */
export class ApiErrorResponseDto {
  @ApiProperty({ description: 'Código HTTP del error.', example: 400 })
  statusCode!: number;

  @ApiProperty({
    description: 'Mensaje de error con código entre paréntesis.',
    example: '(AUT-10) Error creando usuario',
  })
  message!: string;

  @ApiProperty({ description: 'Indica que la operación falló.', example: false })
  success!: boolean;
}
