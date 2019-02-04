import { Type } from "./type";
import { Component } from "./component";

export class TypeMapper<T extends Type<string>, M = { $: T["$"] }> {
    select<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): TypeMapper<T, Record<K, S> & M> {
        return this as any;
    }

    selectIf<K extends Component.Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K, flag: boolean): TypeMapper<T, Record<K, S | undefined> & M> {
        return this as any;
    }

    expand<
        K extends Component.Navigable.Keys<T> & string,
        E extends Type<string> = Component.Navigable.OtherType<T[K]>,
        O extends Type<string> = E
    >(k: K, _: (eq: TypeMapper<E>) => TypeMapper<E, O>):
        TypeMapper<T, Record<K, T[K] & Component.Expanded<O>> & M> {
        return this as any;
    }

    expandIf<
        K extends Component.Navigable.Keys<T> & string,
        E extends Type<string> = Component.Navigable.OtherType<T[K]>,
        O extends Type<string> = E
    >(k: K, flag: boolean, _: (eq: TypeMapper<E>) => TypeMapper<E, O>):
        TypeMapper<T, Record<K, undefined | (T[K] & Component.Expanded<O>)> & M> {
        return this as any;
    }

    get(): M {
        return null as any;
    }
}
