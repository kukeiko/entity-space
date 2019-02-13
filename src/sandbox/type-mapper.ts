import { Type } from "./type";
import { Component } from "./component";


type Foo<T> = {
    [K in keyof T]: T[K] extends Component.Navigable<any> ? T[K] : never;
};

export class TypeMapper<T extends Type<string>, M = { $: T["$"] }> {
    select<
        P extends Component.Local & Component.Property<any, any>,
        O extends Type<string>
    >(_: (foo: Required<T>) => P): TypeMapper<T, Record<P["key"], P & Component.Local.Selected<ReturnType<P["read"]>>> & M>;

    select<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(_: (foo: Required<T>) => P, _q: (eq: TypeMapper<Component.Navigable.OtherType<P>>) => TypeMapper<any, O>): TypeMapper<T, Record<P["key"], P & Component.Navigable.Selected<O>> & M>;

    select(...args: any[]): any {
        return this as any;
    }

    selectIf<
        P extends Component.Local & Component.Property<any, any>,
        O extends Type<string>
    >(_: (foo: Required<T>) => P): TypeMapper<T, Record<P["key"], undefined | (P & Component.Local.Selected<ReturnType<P["read"]>>)> & M>;

    selectIf<
        P extends Component.Navigable<any> & Component.Property<any, any>,
        O extends Type<string>
    >(_: (foo: Required<T>) => P, _q: (eq: TypeMapper<Component.Navigable.OtherType<P>>) => TypeMapper<any, O>): TypeMapper<T, Record<P["key"], undefined | (P & Component.Navigable.Selected<O>)> & M>;

    selectIf(...args: any[]): any {
        return this as any;
    }

    get(): M {
        return null as any;
    }
}
