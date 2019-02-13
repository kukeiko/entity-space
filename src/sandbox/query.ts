import { Type } from "./type";
import { Component } from "./component";
import { Filter } from "./filter";

type FetchPrimitiveType<T> = T extends Component.Primitive<infer R> ? R : never;

class CriterionBuilder<T extends Component.Primitive.Type> {
    equals(value: ReturnType<T>, invert = false): this {
        let x = Filter.equals(value, invert);
        return this as any;
    }

    notEuals(value: ReturnType<T>, invert = false): this {
        let x = Filter.notEquals(value, invert);
        return this as any;
    }

    from(value: ReturnType<T>, inclusive = false): this {
        let x = Filter.from(value, inclusive);
        return this as any;
    }

    to(value: ReturnType<T>, inclusive = false): this {
        let x = Filter.to(value, inclusive);
        return this as any;
    }

    fromTo(values: [ReturnType<T>, ReturnType<T>], inclusive: boolean | [boolean, boolean] = true): this {
        let x = Filter.fromTo(values, inclusive);
        return this as any;
    }
}

export class Query<T extends Type<string>, M = { $: T["$"] }> {
    // [note] we need to help the compiler by using different number of arguments for each overload (afaik)
    select<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(
        _0: (foo: Required<T>) => P,
        _1: (eq: Query<Component.Navigable.OtherType<P>>) => Query<any, O>
    ): Query<T, Record<P["key"], P & Component.Navigable.Selected<O>> & M>;

    select<
        P extends Component.Local & Component.Property<any, any>
    >(
        _: (foo: Required<T>) => P,
    ): Query<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    select<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
    >(
        _0: (foo: Required<T>) => P,
        _1: any,
        _2: (f: CriterionBuilder<P["primitiveType"]>) => any
    ): Query<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    select(...args: any[]): any {
        return this as any;
    }

    selectIf<
        P extends Component.Local & Component.Property<any, any>,
        O extends Type<string>
    >(_: (foo: Required<T>) => P): Query<T, Record<P["key"], undefined | (P & Component.Local.Selected<ReturnType<P["read"]>>)> & M>;

    selectIf<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(_: (foo: Required<T>) => P, _q: (eq: Query<Component.Navigable.OtherType<P>>) => Query<any, O>): Query<T, Record<P["key"], undefined | (P & Component.Navigable.Selected<O>)> & M>;

    selectIf(...args: any[]): any {
        return this as any;
    }

    _select<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): Query<T, Record<K, S> & M> {
        return this as any;
    }

    _selectIf<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K, flag: boolean): Query<T, Record<K, S | undefined> & M> {
        return this as any;
    }

    filter<
        K extends Component.Primitive.Keys<T>
    // >(k: K, c: Filter.Criterion.ForConstructor<FetchPrimitiveType<T[K]>>): this {
    >(k: K, _: (f: CriterionBuilder<FetchPrimitiveType<T[K]>>) => any): Query<T, M> {
        return this as any;
    }

    expand<
        K extends Component.Navigable.Keys<T> & string,
        E extends Type<string> = Component.Navigable.OtherType<T[K]>,
        O extends Type<string> = E
    >(k: K, _: (eq: Query<E>) => Query<E, O>):
        Query<T, Record<K, T[K] & Component.Expanded<O>> & M> {
        return this as any;
    }

    expandIf<
        K extends Component.Navigable.Keys<T> & string,
        E extends Type<string> = Component.Navigable.OtherType<T[K]>,
        O extends Type<string> = E
    >(k: K, flag: boolean, _: (eq: Query<E>) => Query<E, O>):
        Query<T, Record<K, undefined | (T[K] & Component.Expanded<O>)> & M> {
        return this as any;
    }

    get(): M {
        return null as any;
    }
}
// [note] seems that exporting via module trashes performance
// export module Query {
//     export class CriterionBuilder<T extends Component.Primitive.Type> {
//         equals(value: ReturnType<T>, invert = false): this {
//             let x = Filter.equals(value, invert);
//             return this as any;
//         }

//         notEuals(value: ReturnType<T>, invert = false): this {
//             let x = Filter.notEquals(value, invert);
//             return this as any;
//         }

//         from(value: ReturnType<T>, inclusive = false): this {
//             let x = Filter.from(value, inclusive);
//             return this as any;
//         }

//         to(value: ReturnType<T>, inclusive = false): this {
//             let x = Filter.to(value, inclusive);
//             return this as any;
//         }

//         fromTo(values: [ReturnType<T>, ReturnType<T>], inclusive: [boolean, boolean] = [false, false]): this {
//             let x = Filter.fromTo(values, inclusive);
//             return this as any;
//         }
//     }
// }
