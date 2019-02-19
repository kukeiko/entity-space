import { Type } from "../type";
import { Component } from "../component";

import { CriterionBuilder } from "./criterion-builder";
import { SetCriterionBuilder } from "./set-criterion-builder";

export class Query<T extends Type<string>, M = { $: T["$"] }> {
    select<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
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
        _1: ((f: SetCriterionBuilder<P["primitiveType"]>) => any)[][]
    ): Query<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    select<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(
        _0: (foo: Required<T>) => P,
        _1: (eq: Query<P["navigated"]>) => Query<any, O>
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
        _1: (eq: Query<P["navigated"]>) => Query<any, O>
    ): Query<T, Record<P["key"], undefined | (P & Component.Navigable.Selected<O>)> & M>;

    selectIf(...args: any[]): any {
        return this as any;
    }

    get(): M {
        return null as any;
    }

    apply<O = M>(fn: (x: Query<T>) => Query<T, O>): Query<T, M & O> {
        return fn(this as any) as any;
    }
}
