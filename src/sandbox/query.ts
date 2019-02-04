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

    fromTo(values: [ReturnType<T>, ReturnType<T>], inclusive: [boolean, boolean] = [false, false]): this {
        let x = Filter.fromTo(values, inclusive);
        return this as any;
    }
}

// export class Query<T extends Type<string>, M = { $: T["$"] }> extends TypeMapper<T, M> {
export class Query<T extends Type<string>, M = { $: T["$"] }> {
    filter<
        K extends Component.Primitive.Keys<T>
    // >(k: K, c: Filter.Criterion.ForConstructor<FetchPrimitiveType<T[K]>>): this {
    >(k: K, _: (f: CriterionBuilder<FetchPrimitiveType<T[K]>>) => any): Query<T, M> {
        return this as any;
    }

    select<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): Query<T, Record<K, S> & M> {
        return this as any;
    }

    selectIf<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K, flag: boolean): Query<T, Record<K, S | undefined> & M> {
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
