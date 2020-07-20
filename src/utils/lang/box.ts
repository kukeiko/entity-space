/**
 * Wrap T as an array if U is an array. U defaults to being an array.
 */
export type Box<T, U = any[]> = any[] extends U ? T[] : T;
// [todo] seems like switching positions of U & any[] solved the "possibly infinite type recursion" error, f*ck yeah!
// export type Box<T, U = any[]> = U extends any[] ? T[] : T;
