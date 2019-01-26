import { Type } from "./type";
import { Property as _Property } from "./property";
import { Id as _Id, Reference as _Reference, Local as _Local, Navigable as _Navigable, External as _External } from "./properties";

type TypeCauldron = Map<string, Type<string>>;

export class DomainBuilder<M = {}> {
    private _types: TypeCauldron = new Map();
    private _typeCtorOptions = new Map<string, DomainBuilder.TypeConstructionOptions<Type<any>, any>>();

    add<T extends Type<K>, K extends string>(t: DomainBuilder.TypeConstructionOptions<T, K>): DomainBuilder<Record<K, T> & M> {
        this._typeCtorOptions.set(t.$.name, t);

        return this as any;
    }

    build(): this {
        let typeCauldron: TypeCauldron = new Map();

        this._typeCtorOptions.forEach(options => {
            let type: Type<any> = {
                $: {
                    ...options.$
                }
            };

            for (let k in options) {
                if (k === "$") continue;
                (type as any)[k] = {};
            }

            typeCauldron.set(options.$.name, type);
        });

        this._typeCtorOptions.forEach(options => {
            let type = typeCauldron.get(options.$.name) as Type<string>;

            for (let k in options) {
                if (k === "$") continue;

                // let property = this._constructAnyProperty(k, (options as any)[k], typeCauldron);
                let property = DomainBuilder.PropertyDeclaration.Any.construct(k, (options as any)[k], typeCauldron);

                // for (let pk in property) {
                for (let pk in property) {
                    (type as any)[k][pk] = (property as any)[pk];
                }
                // (type as any)[k] = this._constructAnyProperty(k, (options as any)[k], typeCauldron);
            }

            this._types.set(options.$.name, type);
        });

        return this;
    }
}

export module DomainBuilder {
    export type NameOfType<D, T> = D extends DomainBuilder<infer M>
        ? { [K in keyof M]: M[K] extends T ? K : never }[keyof M]
        : never;

    export type TypeConstructionOptions<T extends Type<K>, K extends string, P extends keyof T = _Property.Keys<T> & keyof T> =
        {
            $: {
                name: K;
            }
        } & {
            [F in P]?
            : T[F] extends _Id<infer V, infer K, infer A, infer D> ? PropertyDeclaration.Id<V, K, A, D>
            : T[F] extends _Reference.Id.Patchable<infer R, infer K, infer P, infer A, infer V, infer D> ? PropertyDeclaration.Reference.Key.Patchable<R, K, P, A, V, D>
            : T[F] extends _Reference.Id.Creatable<infer R, infer K, infer P, infer A, infer V, infer D> ? PropertyDeclaration.Reference.Key.Creatable<R, K, P, A, V, D>
            : T[F] extends _Reference.Id<infer R, infer K, infer P, infer A, infer V, infer D> ? PropertyDeclaration.Reference.Key<R, K, P, A, V, D>
            : T[F] extends _Reference<infer R, infer K, infer P, infer A, infer V> ? PropertyDeclaration.Reference<R, K, P, A, V>
            : T[F] extends _Reference.Virtual<infer R, infer K, infer P, infer A, infer V> ? PropertyDeclaration.Reference.Virtual<R, K, P, A, V>
            : never;
        };

    export module PropertyDeclaration {
        type DtoConversion<V, D> = (D extends V ? {
            fromDto?: (dtoValue: D) => V;
            toDto?: (value: V) => D;
        } : {
            fromDto: (dtoValue: D) => V;
            toDto: (value: V) => D;
        });

        // export type Property<V, K, A, D, L = V extends any[] ? true : false> = {
        export type Property<V, K, A = K, D = V> =
            {
                dtoKey?: A;
            }
            & (K extends A ? {} : { dtoKey: A; })
            & (V extends any[] ? { array: true; ordered?: boolean; } : {});

        export module Property {
            export function construct(key: string, isArray: boolean, options: Property<any, any, any, any>): _Property.Dto<any, any> {
                let dtoKey = options.dtoKey || key;

                return {
                    dtoKey: dtoKey,
                    key: key,
                    read: x => x[key],
                    write: (x, v) => x[key] = v,
                    readDto: x => x[dtoKey],
                    writeDto: (x, v) => x[dtoKey] = v
                };
            }
        }

        export type Local<V, K, A, D> = {

        } & Property<V, K, A, D> & DtoConversion<V, D>;

        export module Local {
            export function construct(name: string, isArray: boolean, options: Local<any, any, any, any>): _Local<any, any> {
                return {
                    ...Property.construct(name, isArray, options),
                    // fromDto: options.fromDto || (x => x),
                    local: true,
                    // toDto: options.toDto || (x => x)
                };
            }
        }

        export type Navigable<T, V, K, A, D> = {
            navigated: T;
        } & Property<V, K, A, D>;

        export module Navigable {
            export function construct(name: string, isArray: boolean, options: Navigable<any, any, any, any, any>): _Navigable<any, any, any> {
                return {
                    ...Property.construct(name, isArray, options),
                    navigable: true,
                    navigated: options.navigated
                };
            }
        }

        export module External {

        }

        export type Id<V, K, A, D> = {
            type: "id";
        } & Local<V, K, A, D> & Property<V, K, A, D>;

        export module Id {
            export function construct(name: string, options: Id<any, any, any, any>): _Id<any, any> {
                return {
                    ...Local.construct(name, false, options),
                    id: true,
                    unique: true
                };
            }
        }

        // export type Complex<T, K extends string, A extends string = K, V = Box<Instance<Unbox<T>>, T>>

        export type Reference<T, K, P, A, V, N = P extends _Property<any, any> ? P["key"] : never> = {
            key: N;
            type: "reference";
        } & Property<V, K, A, any>;

        export module Reference {
            export type Key<T, K, P, A, V, D, N = T extends Type<any> ? T["$"]["name"] : never> = {
                otherKey: P;
                otherName: N;
                type: "reference-key";
            } & Local<V, K, A, D>;

            export module Key {
                export function construct(name: string, isArray: boolean, options: Key<any, any, any, any, any, any>, cauldron: TypeCauldron): _Reference.Id<any, any, any> {
                    return {
                        ...Local.construct(name, isArray, options),
                        otherKey: (cauldron.get(options.otherName) as any)[options.otherKey]
                    };
                }
                export type Creatable<T, K, P, A, V, D, N = T extends Type<any> ? T["$"]["name"] : never> = {
                    creatable: true;
                } & Key<T, K, P, A, V, D, N>;

                export type Patchable<T, K, P, A, V, D, N = T extends Type<any> ? T["$"]["name"] : never> = {
                    patchable: true;
                } & Creatable<T, K, P, A, V, D, N>;
            }

            export type Virtual<T, K, P, A, V, N = P extends _Property<any, any> ? P["key"] : never> = {
                virtual: true;
            } & Reference<T, K, P, A, V, N>;
        }

        export type Any
            = Id<any, any, any, any>
            | Reference<any, any, any, any, any>
            | Reference.Key<any, any, any, any, any, any>;

        export module Any {
            export function construct(name: string, options: Any, cauldron: TypeCauldron): Property<any, any> {
                switch (options.type) {
                    // case "id": return this._constructId(name, options);
                    case "id": return DomainBuilder.PropertyDeclaration.Id.construct(name, options);
                    case "reference": {
                        return null as any;
                    }
                    case "reference-key": return DomainBuilder.PropertyDeclaration.Reference.Key.construct(name, "isArray" in options, options, cauldron);
                    // case "reference-key": return this._constructReferenceKey(name, "isArray" in options, options, typeCauldron);
                }

                // throw new Error(`Unknown property construction type '${options.type}' for property '${name}'`);
                throw new Error(`Unknown property construction type '${(options as any).type}' for property '${name}'`);
            }
        }
    }
}
