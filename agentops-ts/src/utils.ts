import { v4 as uuidv4 } from 'uuid';

/**
 * Get the current UTC time in ISO 8601 format with milliseconds precision.
 * @returns {string} The current UTC time as a string in ISO 8601 format.
 */
export const getISOTime = (): string => {
  return new Date().toISOString();
};

/**
 * Check if a value can be safely serialized to JSON.
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value can be serialized, false otherwise.
 */
export const isJsonable = (value: any): boolean => {
  try {
    JSON.stringify(value);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Recursively filter out un-JSONable values from objects and arrays.
 * @param {any} data - The data to filter.
 * @returns {any} The filtered data.
 */
export const filterUnjsonable = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return isJsonable(data) ? data : '';
  }

  if (Array.isArray(data)) {
    return data.map(filterUnjsonable);
  }

  return Object.fromEntries(
    Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, filterUnjsonable(value)])
  );
};

/**
 * Safely serialize an object to JSON, handling special cases.
 * @param {any} obj - The object to serialize.
 * @returns {string} The JSON string representation of the object.
 */
export const safeSerialize = (obj: any): string => {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    return value;
  });
};
