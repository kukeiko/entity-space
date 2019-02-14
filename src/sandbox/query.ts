import { Type } from "./type";
import { Component } from "./component";
import { Filter } from "./filter";

type FetchPrimitiveType<T> = T extends Component.Primitive<infer R> ? R : never;

/**
 * [notes]
 * criteria chained via functions on same builder should be combined
 * => "or" happens via using multiple criterion builders (array @ Query.select())
 */
class CriterionBuilder<T extends Component.Primitive.ValueType> {
    // [note] is null if criteria have been combined that won't ever be reachable
    private _criterion?: Filter.Criterion | null = null;

    private _combine(criterion: Filter.Criterion): this {
        if (this._criterion === null) return this;

        if (this._criterion === undefined) {
            this._criterion = criterion;
        } else {
            this._criterion = Filter.combineCriterion(this._criterion, criterion);
        }

        return this;
    }

    equals(value: ReturnType<T>, invert = false): this {
        return this._combine(Filter.equals(value, invert));
    }

    notEuals(value: ReturnType<T>, invert = false): this {
        return this._combine(Filter.notEquals(value, invert));
    }

    from(value: ReturnType<T>, inclusive = false): this {
        return this._combine(Filter.from(value, inclusive));
    }

    to(value: ReturnType<T>, inclusive = false): this {
        return this._combine(Filter.to(value, inclusive));
    }

    fromTo(values: [ReturnType<T>, ReturnType<T>], inclusive: boolean | [boolean, boolean] = true): this {
        return this._combine(Filter.fromTo(values, inclusive));
    }

    in(values: Iterable<ReturnType<T>>, invert = false): this {
        return this._combine(Filter.memberOf(values, invert));
    }

    notIn(values: Iterable<ReturnType<T>>, invert = false): this {
        return this._combine(Filter.notMemberOf(values, invert));
    }
}

export class Query<T extends Type<string>, M = { $: T["$"] }> {
    select<
        P extends Component.Local & Component.Property<any, any>
    >(
        _: (foo: Required<T>) => P,
    ): Query<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    select<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
    >(
        _0: (foo: Required<T>) => P,
        _1: ((f: CriterionBuilder<P["primitiveType"]>) => any)[]
    ): Query<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    select<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(
        _0: (foo: Required<T>) => P,
        _1: (eq: Query<Component.Navigable.OtherType<P>>) => Query<any, O>
    ): Query<T, Record<P["key"], P & Component.Navigable.Selected<O>> & M>;

    select(...args: any[]): any {
        return this as any;
    }

    selectIf<
        P extends Component.Local & Component.Property<any, any>
    >(
        _: (foo: Required<T>) => P,
    ): Query<T, Record<P["key"], undefined | (P & Component.Local.Selected<ReturnType<P["read"]>>)> & M>;

    selectIf<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
    >(
        _0: (foo: Required<T>) => P,
        _1: ((f: CriterionBuilder<P["primitiveType"]>) => any)[]
    ): Query<T, Record<P["key"], undefined | (P & Component.Local.Selected<ReturnType<P["read"]>>)> & M>;

    selectIf<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(
        _0: (foo: Required<T>) => P,
        _1: (eq: Query<Component.Navigable.OtherType<P>>) => Query<any, O>
    ): Query<T, Record<P["key"], undefined | (P & Component.Navigable.Selected<O>)> & M>;

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
