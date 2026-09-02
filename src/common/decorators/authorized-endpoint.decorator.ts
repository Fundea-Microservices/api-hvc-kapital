import { SetMetadata } from '@nestjs/common';

export const AUTHORIZED_ENDPOINT_KEY = 'authorizedEndpoint';

/**
 * Metadata almacenada por el decorador.
 */
export interface AuthorizedEndpointMeta {
  /** Método HTTP (GET, POST, PUT, PATCH, DELETE) */
  httpMethod: string;
  /**
   * Ruta relativa del endpoint (sin prefijo global).
   * Soporta parámetros de ruta con :nombre.
   * Ejemplos: 'auth/usuarios', 'auth/usuarios/:id'
   */
  path: string;
}

/**
 * Marca un método de un service como endpoint que puede ejecutarse
 * con autorización a través de POST /ejecutar-con-autorizacion.
 *
 * El método decorado recibe:
 *   - body: any           → Body de la petición original
 *   - solicitanteId: string → UUID del usuario logueado (del JWT)
 *   - params?: Record<string, string> → Parámetros de ruta (ej: { id: 'uuid' })
 *
 * @example
 * // En cualquier service:
 * @AuthorizedEndpoint('POST', 'auth/usuarios')
 * async crear(body: any, solicitanteId: string) {
 *   return this.create(body);
 * }
 *
 * @AuthorizedEndpoint('PUT', 'auth/usuarios/:id')
 * async editar(body: any, solicitanteId: string, params: Record<string, string>) {
 *   return this.update(params.id, body);
 * }
 */
export const AuthorizedEndpoint = (
  httpMethod: string,
  path: string,
) => SetMetadata(AUTHORIZED_ENDPOINT_KEY, { httpMethod, path } as AuthorizedEndpointMeta);
