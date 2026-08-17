import { TransformFnParams } from 'class-transformer';

/**
 * Strict boolean transformer that interprets common truthy/falsey string and numeric values.
 * - true: true, 'true', '1', 1, 'yes', 'y', 'si', 'sí'
 * - false: false, 'false', '0', 0, 'no', 'n'
 * Leaves value as-is if it cannot be confidently parsed, allowing @IsBoolean to fail validation if needed.
 */
export function toBoolean({ value }: TransformFnParams): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'si', 'sí'].includes(v)) return true;
    if (['false', '0', 'no', 'n'].includes(v)) return false;
  }
  // Return original to let validation layer decide if it's acceptable
  return value;
}
