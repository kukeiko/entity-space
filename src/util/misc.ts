export interface INoArgsCtor extends Function {
    new (...args: any[]): any;
}

export interface ITypeOf<T> extends Function {
    new (...args: any[]): T;
}

export interface Indexable extends Object {
    [key: string]: any;
}

export interface IStringable {
    toString(): string;
}

export function combinations<T>(items: T[]): T[][] {
    if (items.length == 0) return [];

    let sub = combinations(items.slice(1));
    let result = [[items[0]]];

    sub.forEach(s => {
        result.push([items[0], ...s]);
        result.push([...s]);
    });

    return result;
}

/**
 * https://stackoverflow.com/a/2117523
 */
export function guid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);

        return v.toString(16);
    });
}

export type ArrayLike<T>
    = Array<T>
    | ReadonlyArray<T>;
