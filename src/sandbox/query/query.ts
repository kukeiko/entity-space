import { Type } from "../type";
import { Component } from "../component";

import { CriterionBuilder } from "./criterion-builder";
import { SetCriterionBuilder } from "./set-criterion-builder";

// type DetermineCriterionBuilder<T extends Component.Primitive.ValueType>
//  = 

export class Query<T extends Type<string>, M = { $: T["$"] }> {
    private _type: T;
    private _built: Type<string> & { [key: string]: Component.Property<string, any, any>; };

    constructor(type: T) {
        this._type = type;
        this._built = { $: type.$ } as any;
    }

    select<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
    >(
        // _: (foo: Required<T>) => P,
        _: (foo: T) => P,
    ): Query<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    select<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
    >(
        // _0: (foo: Required<T>) => P,
        _0: (foo: T) => P,
        _1: ((filter: CriterionBuilder<P["primitiveType"]>) => any)[]
    ): Query<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    /**
     * [todo] this signature could be used for filtering arrays of primitives.
     * it is a bit weird but i did not manage to do it in another way while also
     * maintaining the ability to select a property by writing "x => x.name"
     * (and also having just "select" as the method name with all its overloads)
     */
    select<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
    >(
        // _0: (foo: Required<T>) => P,
        _0: (foo: T) => P,
        _1: ((filter: SetCriterionBuilder<P["primitiveType"]>) => any)[][]
    ): Query<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    select<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(
        // _0: (foo: Required<T>) => P,
        _0: (foo: T) => P,
        _1: (eq: Query<P["navigated"]>) => Query<any, O>
    ): Query<T, Record<P["key"], P & Component.Navigable.Selected<O>> & M>;

    select(...args: any[]): any {
        let getProperty: (x: T) => Component.Property<string, any, any> = args[0];
        let property = getProperty(this._type);



        if (Component.Local.is(property)) {
            let cloned: Component.Property<string, any, any> & Component.Local.Selected<any> = {
                ...property,
                // [note] null because it doesn't matter (at least for now).
                // this property only exists to supply type hinting during development
                selected: null as any
            };

            this._built[property.key] = cloned;
        } else if (Component.Navigable.is(property)) {
            let subQuery = new Query(property.navigated);

            let cloned: Component.Property<string, any, any> & Component.Navigable.Selected<any> = {
                ...property,
                selected: subQuery.get()
            };

            this._built[property.key] = cloned;
        }


        // cloned.s


        return this as any;
    }

    selectIf<
        P extends Component.Local & Component.Property<any, any>
    >(
        // _: (foo: Required<T>) => P,
        _: (foo: T) => P,
    ): Query<T, Record<P["key"], undefined | (P & Component.Local.Selected<ReturnType<P["read"]>>)> & M>;

    // [note] multiple criteria are combined w/ "or"
    selectIf<
        P extends Component.Primitive<any> & Component.Local & Component.Property<any, any>
    >(
        // _0: (foo: Required<T>) => P,
        _0: (foo: T) => P,
        _1: ((f: CriterionBuilder<P["primitiveType"]>) => any)[]
    ): Query<T, Record<P["key"], undefined | (P & Component.Local.Selected<ReturnType<P["read"]>>)> & M>;

    selectIf<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(
        // _0: (foo: Required<T>) => P,
        _0: (foo: T) => P,
        _1: (eq: Query<P["navigated"]>) => Query<any, O>
    ): Query<T, Record<P["key"], undefined | (P & Component.Navigable.Selected<O>)> & M>;

    selectIf(...args: any[]): any {
        return this as any;
    }

    get(): M {
        return null as any;
    }

    // [note] no idea what this is meant to do. i think maybe for merging queries?
    apply<O = M>(fn: (x: Query<T>) => Query<T, O>): Query<T, M & O> {
        return fn(this as any) as any;
    }
}
