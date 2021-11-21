/**
 * A type that has a constructor.
 */
export type Class<T = any> = (new (...args: any) => T) | (abstract new (...args: any) => T);
