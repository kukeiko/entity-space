export type Primitive = typeof Boolean | typeof Number | typeof String;

export type Class = new (...args: any) => any;

export type Unbox<T>
    = T extends any[] ? T[number]
    : T extends Class ? InstanceType<T>
    : T extends (...args: any[]) => any ? ReturnType<T>
    : T;
