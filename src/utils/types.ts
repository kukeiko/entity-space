import { Observable } from "rxjs";
export type Json = string | number | boolean | null | Json[] | { [property: string]: Json };
export type Unbox<T> = T extends any[] ? T[number] : T;
export type Class<T = any> = new (...args: any) => T;
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
export type SyncOrAsyncValue<T> = T | Promise<T> | Observable<T>;
