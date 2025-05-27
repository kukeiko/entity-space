export type Json = string | number | boolean | null | Json[] | { [property: string]: Json };
export type Unbox<T> = T extends any[] ? T[number] : T;
export type Class<T = any> = new (...args: any) => T;
