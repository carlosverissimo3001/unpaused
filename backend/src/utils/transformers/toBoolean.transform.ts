/**
 * Converts a string to a boolean
 * We need this as the parameter is passed as a string from the frontend (I believe)
 * @param value The value to convert
 * @returns The boolean value
 */

const BOOL_VALUES = ['TRUE', 'FALSE'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toBoolean(value: any): any {
    if (typeof value === 'boolean') {
      return value;
    }
    if (
    BOOL_VALUES.includes(value.toUpperCase()) &&
      typeof value === 'string'
    ) {
      return value.toUpperCase() === 'TRUE';
    }
    return value;
  }