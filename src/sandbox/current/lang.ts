export type Unbox<T> = T extends any[] ? T[number] : T;
export type Box<T, A = T> = A extends any[] ? T[] : T;
