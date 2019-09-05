import { Definition } from "./definition";
import { Property } from "../property";
import { Component } from "../component";
import { Type } from "../type";
import { Domain } from "./domain";

export class DomainBuilder<B = {}> {
    private _typesArgs: Record<string, Record<string, Definition.AllArgs>> = {};

    define<T extends Type<any>>(definition: DomainBuilder.DefineArguments<T>): DomainBuilder<B & Record<T["$"]["key"], T>> {
        this._typesArgs[definition.$.key] = definition as any;

        return this as any;
    }

    getType<K extends keyof B>(key: K): B[K] {
        return null as any;
    }

    build(): Domain<B> {
        let types = this._constructTypes(this._typesArgs);

        for (let k in types) {
            this._buildType(types, k, this._typesArgs[k]);
        }

        return null as any;
    }

    private _constructTypes(typesArgs: Record<string, Record<string, Definition.AllArgs>>): Record<string, Type<string>> {
        let types: Record<string, Type<string>> = {};

        for (const key in typesArgs) {
            types[key] = {
                $: { key }
            };
        }

        return types;
    }

    private _buildType(types: Record<string, Type<string>>, typeKey: string, typeArgs: Record<string, Definition.AllArgs>): void {
        let type = types[typeKey] as Record<string, any>;

        for (let key in typeArgs) {
            let propArgs = typeArgs[key];

            switch (propArgs.type) {
                case "id": type[key] = this._createIdProperty(key, propArgs); break;
                case "primitive": type[key] = this._createPrimitiveProperty(key, propArgs); break;

                default:
                    throw new Error(`unknown property definition type '${(propArgs as any).type}'`);
            }
        }
    }

    private _createIdProperty(key: string, args: Definition.Id.AllArgs): Property.Id<string, Component.Primitive.ValueType, string, Component.Primitive.ValueType> {
        let dtoKey = args.dtoKey || key;

        return {
            key,
            dtoKey,
            array: false,
            fromDto: args.fromDto || (x => x as any),
            id: true,
            local: true,
            modifiers: { u: true },
            primitive: args.primitive,
            read: x => x[key],
            readDto: x => x[dtoKey],
            toDto: args.fromDto || (x => x as any),
            type: "id",
            write: (x, v) => ((x[key] as any) = v),
            writeDto: (x, v) => ((x[dtoKey] as any) = v)
        };
    }

    private _createPrimitiveProperty(key: string, args: Definition.Primitive.AllArgs): Property.Primitive<string, Component.Primitive.ValueType, any, string, Component.Primitive.ValueType> {
        let dtoKey = args.dtoKey || key;

        return {
            key,
            dtoKey,
            array: false,
            fromDto: args.fromDto || (x => x as any),
            local: true,
            modifiers: args.flags || {},
            primitive: args.primitive,
            read: x => x[key],
            readDto: x => x[dtoKey],
            toDto: args.fromDto || (x => x as any),
            type: "primitive",
            write: (x, v) => ((x[key] as any) = v),
            writeDto: (x, v) => ((x[dtoKey] as any) = v)
        };
    }
}

export module DomainBuilder {
    export type DefineArguments<T extends Type<string>>
        = {
            $: T["$"];
        } & DefineArguments.PropertiesOnly<T>;

    export module DefineArguments {
        export type PropertiesOnly<T> = {
            [K in Component.Property.Keys<T>]
            : Definition.Id<T[K]>
            & Definition.Id.Computed<T[K]>
            & Definition.Primitive<T[K]>
            & Definition.Primitive.Computed<T[K]>
            & Definition.Primitive.Ethereal<T[K]>
            & Definition.Primitive.Array<T[K]>
            & Definition.Primitive.Array.Deserialized<T[K]>
            ;
        };
    }
}
