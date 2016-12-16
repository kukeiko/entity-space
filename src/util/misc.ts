export interface INoArgsCtor extends Function {
    new (): any;
}

export interface ITypeOf<T> extends Function {
    new (...args: any[]): T;
}

export interface IClass extends Function {
    new (...args: any[]): any;
}

export function lazyReference<T>(fn: () => ITypeOf<T>): ITypeOf<T> {
    (fn as any).__is_lazy_reference__ = true;

    return fn as any as ITypeOf<T>;
}

export function resolveLazyReference(fn: Function): ITypeOf<any> {
    return (fn as any).__is_lazy_reference__ ? fn() : fn;
}

export function convert<T>(value: any, t: ITypeOf<T>): T {
    if (t === Boolean as any) {
        if (typeof (value) == "string") {
            value = (value as string).toLowerCase() == "true" ? true : false;
        }
        //TODO: why converting into a Boolean object?
        return new Boolean(value) as any;
    }

    return new t(value);
}
