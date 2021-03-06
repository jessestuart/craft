import { shouldPerform } from 'dryrun';
import { logger } from '../logger';

/**
 * Writes a message to "error" log if in dry-mode, throws an error otherwise
 *
 * @param message Error message
 * @param customLogger Optional logger to use
 */
export function reportError(message: string, customLogger?: any): void {
  const errorLogger = customLogger || logger;
  if (shouldPerform()) {
    throw new Error(message);
  } else {
    errorLogger.error(`[dry-run] ${message}`);
  }
}

/**
 * Checks at runtime that the type of the object is what we expect it is
 *
 * Throws an error if the type of the object is different.
 *
 * @param obj Object, which type we're checking
 * @param typeName Expected type name
 * @param message Optional error message
 */
export function coerceType<T>(
  obj: T,
  typeName:
    | 'string'
    | 'number'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'object'
    | 'function',
  message?: string
): T | never {
  const objType = typeof obj;
  if (objType !== typeName) {
    throw new TypeError(
      message || `${obj} is of type "${objType}" (expected: "${typeName}")`
    );
  }
  return obj;
}
