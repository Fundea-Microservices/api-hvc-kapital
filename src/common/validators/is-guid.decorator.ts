import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';

/**
 * Formato GUID de SQL Server (uniqueidentifier): 8-4-4-4-12 hexadecimal.
 *
 * A diferencia de `isUUID` de class-validator (RFC 4122), NO exige los
 * nibbles de versión ni de variante. Varios ids sembrados en la BD no los
 * cumplen (ej. 'C2B3D4E5-6F7A-8B9C-0D1E-2F3A4B5C6D7E'), pero son valores
 * válidos para la columna `uniqueidentifier`.
 */
export const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGuid(value: unknown): boolean {
  return typeof value === 'string' && GUID_REGEX.test(value);
}

/**
 * Reemplazo de `@IsUUID()` para ids de la BD. Acepta cualquier GUID con
 * formato 8-4-4-4-12, sin validar versión/variante.
 */
export function IsGuid(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isGuid',
      validator: {
        validate: (value): boolean => isGuid(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property debe ser un UUID válido',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
