import { Type } from "../type";
import { Component, Property } from "@sandbox";
import { Definition } from "./definition";

export class DomainBuilder {
    private _definitions = new Map<string, Domain.DefineArguments<Type<string>>>();

    define<T extends Type<any>, K extends string = T["$"]["key"]>(key: K, definition: Domain.DefineArguments<T>): void {
        this._definitions.set(key, definition);
    }

    build(): void {
        for (const [key, definition] of this._definitions) {
            if (Component.Local.is(definition)) {

            }
        }
    }
}

export class Domain {
    constructor() {
    }

    private _types = new Map<string, Type<any>>();
    private _domains = new Set<Domain>();

    define<T extends Type<any>, K = T["$"]["key"]>(key: K, definition: Domain.DefineArguments<T>): void {

    }

    build(): void {

    }
}

export module Domain {
    export type DefineArguments<T> = {
        [K in Component.Property.Keys<T>]
        : Definition.Id<T[K]>
        & Definition.Primitive.Array.Serialized<T[K]>
        & Definition.Primitive.Array<T[K]>
        & Definition.Primitive<T[K]>
        & DefineArguments.Children<T[K]>
        & DefineArguments.Reference<T[K]>
        & DefineArguments.ReferenceId<T[K]>
        ;
    };

    export module DefineArguments {
        export type Children<X> = X extends Property.Children<infer K, infer T, infer P, infer A>
            ? {
                parentIdKey: P;
            } : {};

        export type Reference<X> = X extends Property.Reference<infer K, infer T, infer P, infer A>
            ? {
                localIdKey: P["key"];
            } & ModifierOptions<X> : {};

        export type ReferenceId<X> = X extends Property.Reference.Id<infer K, infer T, infer P, infer M, infer A>
            ? {
                otherKey: T["$"]["key"];
                otherIdKey: P;
                otherDomain?: Domain;
            } & ModifierOptions<X> : {};

        export type ModifierOptions<X> = X extends Component.Property<infer K, infer V, infer M>
            ? (
                ("p" extends M ? { options: { p: true; }; } : {})
                & ("c" extends M ? { options: { c: true; }; } : {})
                & ("n" extends M ? { options: { n: true; }; } : {})
            ) : {};
    }
}
