export interface INoArgsCtor extends Function {
    new (...args: any[]): any;
}

export interface ITypeOf<T> extends Function {
    new (...args: any[]): T;
}

export interface IStringIndexable {
    [key: string]: any;
}
