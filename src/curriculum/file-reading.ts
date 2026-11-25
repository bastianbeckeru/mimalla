// Helpers to read a curriculum file and reject it with a reason for the user.

export type FileObject = Record<string, unknown>;

export class InvalidFileError extends Error {}

export function reject(reason: string): never {
  throw new InvalidFileError(reason);
}

export function isObject(value: unknown): value is FileObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

export function readOptionalText(
  value: unknown,
  notTextReason: string,
  emptyReason: string,
) {
  if (value === undefined) return "";
  if (typeof value !== "string") reject(notTextReason);
  if (value === "") reject(emptyReason);
  return value;
}

export function readObjects(value: unknown, reason: string) {
  if (!Array.isArray(value) || !value.every(isObject)) reject(reason);
  return value;
}

export function readOptional<T>(
  value: unknown,
  fallback: T,
  isValid: (value: unknown) => value is T,
  reason: string,
) {
  if (value === undefined) return fallback;
  if (!isValid(value)) reject(reason);
  return value;
}
