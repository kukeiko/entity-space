export interface TypeOf<T> extends Function {
    new (...args: any[]): T;
}

export type AnyType = TypeOf<any>;

export interface NoArgsConstructable extends Function {
    new (...args: any[]): any;
}

export interface StringIndexable {
    [key: string]: any;
}

export interface ToStringable {
    toString(): string;
}

export type ArrayLike<T>
    = Array<T>
    | ReadonlyArray<T>;

export interface DtoLike {
    [key: string]: string | string[] | number | number[] | DtoLike | DtoLike[];
}

/**
 * Returns all possible combinations of the given items.
 */
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
 * Generates a globally unique identifier.
 * 
 * https://stackoverflow.com/a/2117523
 */
export function guid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);

        return v.toString(16);
    });
}
