/**
 * PostgREST returns a to-one embed as an object, but without generated
 * database types the TypeScript client infers an array. This helper accepts
 * either shape so both cases stay safe.
 */
export function firstRelation<T>(
  value: T | T[] | null | undefined,
): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
