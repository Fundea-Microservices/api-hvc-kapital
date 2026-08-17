import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Restringe el acceso a un endpoint (o controlador) a usuarios cuyo rol/usuario
 * tenga asignados los permisos indicados por su código (ej: 'PROD01').
 *
 * El usuario debe tener TODOS los códigos indicados. Los usuarios con rol
 * `esAdmin` siempre tienen acceso total.
 *
 * Requiere token (ya garantizado por el AuthGuard global). Se valida en
 * PermissionsGuard antes de ejecutar el handler.
 *
 * @example
 * @RequirePermissions('PROD01')
 * @Post()
 * create() { ... }
 */
export const RequirePermissions = (...codigos: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codigos);
