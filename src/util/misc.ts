export interface INoArgsCtor extends Function {
    new (...args: any[]): any;
}

export interface ITypeOf<T> extends Function {
    new (...args: any[]): T;
}

export interface IStringIndexable {
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
