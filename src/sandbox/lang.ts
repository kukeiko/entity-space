export type Unbox<T> = T extends any[] ? T[number] : T;
export type Box<T, A = any[]> = A extends any[] ? T[] : T;
