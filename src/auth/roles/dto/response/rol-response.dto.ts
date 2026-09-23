import { Rol } from 'database/entities/rol.entity';

/**
 * Rol del listado con la bandera transitoria `porDefecto`, resuelta en
 * memoria a partir del valor del registro Config `ROL_DEFAULT_ID`.
 * No es una columna de la entidad Rol, solo existe en la respuesta del listado.
 */
export interface RolListadoResponse extends Rol {
  porDefecto: boolean;
}
