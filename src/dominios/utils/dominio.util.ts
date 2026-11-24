import { TransformFnParams } from 'class-transformer';

/**
 * Códigos de dominio guardados en columnas nvarchar(50): se normalizan a
 * mayúsculas y no admiten espacios ni comas (se usan como identificadores en
 * rutas y filtros).
 */
export const DOMINIO_CODIGO_REGEX = /^[A-Z0-9_.-]+$/;

export const toCodigoDominio = ({ value }: TransformFnParams) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

/**
 * Acepta tanto un objeto ya parseado (body JSON) como un string JSON y lo
 * convierte a objeto. Si el string no es JSON válido se deja intacto para que
 * `@IsObject` produzca el 400 correspondiente.
 */
export function toJsonObject({ value }: TransformFnParams): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return undefined;
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

export function esObjetoJson(valor: unknown): valor is Record<string, unknown> {
  return (
    typeof valor === 'object' && valor !== null && !Array.isArray(valor)
  );
}

/** Serializa un objeto JSON para la columna nvarchar(MAX). */
export function serializarJson(valor: unknown): string | null {
  if (valor === undefined || valor === null) {
    return null;
  }
  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    return trimmed === '' ? null : trimmed;
  }
  return JSON.stringify(valor);
}

/**
 * Deserializa el contenido de una columna JSON para la respuesta de la API.
 * Si el valor almacenado no es JSON válido (inserción manual/legacy) se
 * devuelve tal cual en lugar de romper la petición.
 */
export function deserializarJson(valor: string | null | undefined): unknown {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  try {
    return JSON.parse(valor);
  } catch {
    return valor;
  }
}
