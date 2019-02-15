import { Type } from "./type";
import { Component } from "./component";
import { Filter } from "./filter";

type FetchPrimitiveType<T> = T extends Component.Primitive<infer R> ? R : never;

class FooBuilder {
    foo(): this {
        return this;
    }
}

/**
 * [notes]
 * criteria chained via functions on same builder should be combined
 * => "or" happens via using multiple criterion builders (array @ Query.select())
 */
// [note] seems that exporting via "Query.CriterionBuilder" trashes performance, so we define it here
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

    // [todo] this signature could be used for filtering arrays of primitives
    select<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
    >(
        _0: (foo: Required<T>) => P,
        _1: ((f: FooBuilder) => any)[][]
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

    // [note] multiple criteria are combined w/ "or"
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

    get(): M {
        return null as any;
    }
}
