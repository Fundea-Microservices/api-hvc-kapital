import { ConfigGeneral } from 'database/entities/configuracion/config-general.entity';

/** Campos escalares editables de ConfigGeneral (los que pueden auditarse). */
export const CAMPOS_CONFIG_GENERAL = [
  'codigoInterno',
  'nombreComercial',
  'codigoCasaCentral',
  'pais',
  'monedaPrincipal',
  'fechaCierre',
  'fechaApertura',
  'cierreMensual',
  'nit',
  'codigoSIB',
  'registroMercadoValores',
  'representanteLegal',
  'dpiRepresentante',
  'direccionFiscal',
  'horaInicioOp',
  'horaCierreOp',
  'activo',
] as const;

export type CampoConfigGeneral = (typeof CAMPOS_CONFIG_GENERAL)[number];

/** Cambiar cualquiera de estas fechas exige auth_code de un autorizador. */
export const CAMPOS_FECHA_PROTEGIDA: readonly CampoConfigGeneral[] = [
  'fechaCierre',
  'fechaApertura',
  'cierreMensual',
];

export const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const DPI_REGEX = /^\d{13}$/;

/** Snapshot completo y plano de la entidad (sin relaciones). */
export function snapshotConfigGeneral(config: ConfigGeneral): Record<string, unknown> {
  const {
    casaCentralValor,
    paisValor,
    monedaValor,
    ...snapshot
  } = config as ConfigGeneral & Record<string, unknown>;

  return snapshot;
}

/**
 * Normaliza fechas para comparar. SQL Server devuelve las columnas `date`
 * como `YYYY-MM-DD`; si TypeORM entrega un Date, se recorta a fecha pura para
 * evitar desfases de zona horaria.
 */
export function normalizarValor(valor: unknown): unknown {
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  return valor;
}

export interface DeltaConfigGeneral {
  delta: Record<string, unknown>;
  camposModificados: CampoConfigGeneral[];
}

/** Calcula el delta solo con los campos enviados que realmente cambiaron. */
export function calcularDelta(
  actual: ConfigGeneral,
  cambios: Partial<Record<CampoConfigGeneral, unknown>>,
): DeltaConfigGeneral {
  const delta: Record<string, unknown> = {};
  const camposModificados: CampoConfigGeneral[] = [];

  for (const campo of CAMPOS_CONFIG_GENERAL) {
    const nuevo = cambios[campo];
    if (nuevo === undefined) continue;

    if (normalizarValor(actual[campo]) !== normalizarValor(nuevo)) {
      delta[campo] = nuevo;
      camposModificados.push(campo);
    }
  }

  return { delta, camposModificados };
}

/**
 * Extrae la IP real del cliente. Considera el primer salto de
 * `x-forwarded-for` y limpia el prefijo IPv4 mapeado en IPv6.
 */
export function extraerIpCliente(request: {
  headers?: Record<string, unknown>;
  socket?: { remoteAddress?: string };
}): string | null {
  const forwarded = request.headers?.['x-forwarded-for'];
  const primero = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const bruta =
    (typeof primero === 'string' ? primero.split(',')[0] : undefined) ??
    request.socket?.remoteAddress ??
    '';

  const limpia = bruta.trim().replace(/^::ffff:/i, '');
  return limpia ? limpia.slice(0, 45) : null;
}

/** Parsea un campo JSON de la bitácora sin romper la respuesta si está corrupto. */
export function parsearJson(valor?: string | null): unknown {
  if (valor === null || valor === undefined || valor === '') return null;

  try {
    return JSON.parse(valor);
  } catch {
    return valor;
  }
}
