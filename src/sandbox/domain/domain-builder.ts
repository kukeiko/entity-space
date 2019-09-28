import { Definition } from "./definition";
import { Property } from "../property";
import { Component } from "../component";
import { Type } from "../type";
import { Domain } from "./domain";

export class DomainBuilder<B = {}> {
    /**
     * [type] => [property] => [property-definition-args]
     */
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

        return new Domain(types as any);
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
            if (key === "$") continue;
            let propArgs = typeArgs[key];

            switch (propArgs.type) {
                case "id": type[key] = this._createIdProperty(key, propArgs); break;
                case "id:computed": type[key] = this._createIdComputed(key, propArgs); break;
                case "primitive": type[key] = this._createPrimitive(key, propArgs); break;
                case "primitive:computed": type[key] = this._createPrimitiveComputed(key, propArgs); break;
                case "primitive:ethereal": type[key] = this._createPrimitiveEthereal(key, propArgs); break;
                case "primitive:array": type[key] = this._createPrimitiveArray(key, propArgs); break;
                case "primitive:array:deserialized": type[key] = this._createPrimitiveArrayDeserialized(key, propArgs); break;
                case "complex": type[key] = this._createComplex(key, types, propArgs); break;
                case "complex:ethereal": type[key] = this._createComplexEthereal(key, types, propArgs); break;
                case "complex:array": type[key] = this._createComplexArray(key, types, propArgs); break;
                case "reference": type[key] = this._createReference(key, types, propArgs); break;
                case "reference:id": type[key] = this._createReferenceId(key, propArgs); break;

                default:
                    // [todo] use "if(assertNever(propArgs))" to ensure exhaustion @ compile time
                    throw new Error(`unknown property definition type '${(propArgs as any).type}'`);
            }
        }
    }

    private _createIdProperty(key: string, args: Definition.Id.AllArgs)
        : Property.Id<string, Component.Primitive.ValueType, string, Component.Primitive.ValueType> {
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
            write: (x, v) => (x[key] as any) = v,
            writeDto: (x, v) => (x[dtoKey] as any) = v
        };
    }

    private _createIdComputed(key: string, args: Definition.Id.Computed.AllArgs)
        : Property.Id.Computed<string, Component.Primitive.ValueType, Type<string> & any, any> {
        return {
            compute: args.compute,
            computed: true,
            computedFrom: args.computedFrom,
            id: true,
            key: key,
            local: true,
            modifiers: { u: true },
            primitive: args.primitive,
            read: x => x[key],
            type: "id:computed",
            write: (x, v) => (x[key] as any) = v
        };
    }

    private _createPrimitive(key: string, args: Definition.Primitive.AllArgs)
        : Property.Primitive<string, Component.Primitive.ValueType, any, string, Component.Primitive.ValueType> {
        let dtoKey = args.dtoKey || key;

        return {
            key,
            dtoKey,
            array: false,
            fromDto: args.fromDto || (x => x),
            local: true,
            modifiers: args.flags || {},
            primitive: args.primitive,
            read: x => x[key],
            readDto: x => x[dtoKey],
            toDto: args.toDto || (x => x),
            type: "primitive",
            write: (x, v) => (x[key] as string | number | boolean) = v,
            writeDto: (x, v) => (x[dtoKey] as string | number | boolean) = v
        };
    }

    private _createPrimitiveComputed(key: string, args: Definition.Primitive.Computed.AllArgs)
        : Property.Primitive.Computed<string, Component.Primitive.ValueType, Type<string> & any, any> {
        return {
            compute: args.compute,
            computed: true,
            computedFrom: args.computedFrom,
            key: key,
            local: true,
            modifiers: args.flags || {},
            primitive: args.primitive,
            read: x => x[key],
            type: "primitive:computed",
            write: (x, v) => ((x[key] as any) = v)
        };
    }

    private _createPrimitiveEthereal(key: string, args: Definition.Primitive.Ethereal.AllArgs)
        : Property.Primitive.Ethereal<string, Component.Primitive.ValueType, any> {
        return {
            ethereal: true,
            key: key,
            local: true,
            modifiers: args.flags || {},
            primitive: args.primitive,
            read: x => x[key],
            type: "primitive:ethereal",
            write: (x, v) => ((x[key] as any) = v)
        };
    }

    private _createPrimitiveArray(key: string, args: Definition.Primitive.Array.AllArgs)
        : Property.Primitive.Array<string, Component.Primitive.ValueType, any> {
        let dtoKey = args.dtoKey || key;

        return {
            array: true,
            dtoKey: dtoKey,
            fromDto: args.fromDto || (x => x),
            key: key,
            local: true,
            modifiers: args.flags || {},
            primitive: args.primitive,
            read: x => x[key],
            readDto: x => x[dtoKey],
            toDto: args.fromDto || (x => x),
            type: "primitive:array",
            write: (x, v) => (x[key] as (string | number | boolean)[]) = v,
            writeDto: (x, v) => (x[key] as (string | number | boolean)[]) = v
        };
    }

    private _createPrimitiveArrayDeserialized(key: string, args: Definition.Primitive.Array.Deserialized.AllArgs)
        : Property.Primitive.Array.Deserialized<string, Component.Primitive.ValueType> {
        let dtoKey = args.dtoKey || key;

        return {
            array: true,
            dtoKey: dtoKey,
            fromDto: args.fromDto,
            key: key,
            local: true,
            modifiers: args.flags || {},
            primitive: args.primitive,
            read: x => x[key],
            readDto: x => x[dtoKey],
            toDto: args.toDto,
            type: "primitive:array:deserialized",
            write: (x, v) => ((x[key] as (string | number | boolean)[]) = v),
            writeDto: (x, v) => ((x[key] as string | number | boolean) = v),
        };
    }

    private _createComplex(key: string, types: Record<string, Type<string>>, args: Definition.Complex.AllArgs)
        : Property.Complex<string, Type<string>, any> {
        let dtoKey = args.dtoKey || key;

        return {
            complex: true,
            dtoKey: dtoKey,
            key: key,
            local: true,
            modifiers: args.flags || {},
            navigable: true,
            navigated: types[args.otherTypeKey],
            read: x => x[key],
            readDto: x => x[dtoKey],
            type: "complex",
            write: (x, v) => ((x[key] as any) = v),
            writeDto: (x, v) => ((x[key] as any) = v)
        };
    }

    private _createComplexEthereal(key: string, types: Record<string, Type<string>>, args: Definition.Complex.Ethereal.AllArgs)
        : Property.Complex.Ethereal<string, Type<string>, any> {
        return {
            complex: true,
            ethereal: true,
            key: key,
            local: true,
            modifiers: args.flags || {},
            navigable: true,
            navigated: types[args.otherTypeKey],
            read: x => x[key],
            type: "complex:ethereal",
            write: (x, v) => ((x[key] as any) = v),
        };
    }

    private _createComplexArray(key: string, types: Record<string, Type<string>>, args: Definition.Complex.Array.AllArgs)
        : Property.Complex.Array<string, Type<string>, any> {
        let dtoKey = args.dtoKey || key;

        return {
            array: true,
            complex: true,
            dtoKey,
            key,
            local: true,
            modifiers: args.flags || {},
            navigable: true,
            navigated: types[args.otherTypeKey],
            read: x => x[key],
            readDto: x => x[dtoKey],
            type: "complex:array",
            write: (x, v) => ((x[key] as any) = v),
            writeDto: (x, v) => ((x[key] as any) = v)
        };
    }

    private _createReference(key: string, types: Record<string, Type<string>>, args: Definition.Reference.AllArgs)
        : Property.Reference<string, Type<string>, any, any> {
        let dtoKey = args.dtoKey || key;

        return {
            dtoKey,
            key,
            local: false,
            localKey: args.localKey,
            modifiers: args.flags || {},
            navigable: true,
            navigated: types[args.otherTypeKey],
            read: x => x[key],
            readDto: x => x[dtoKey],
            type: "reference",
            write: (x, v) => ((x[key] as any) = v),
            writeDto: (x, v) => ((x[key] as any) = v)
        };
    }

    private _createReferenceId(key: string, args: Definition.Reference.Id.AllArgs)
        : Property.Reference.Id<string, Type<string> & any, any, any> {
        let dtoKey = args.dtoKey || key;

        return {
            dtoKey,
            fromDto: args.fromDto || (x => x),
            key,
            local: true,
            modifiers: args.flags || {},
            otherIdKey: args.otherIdKey,
            otherTypeKey: args.otherTypeKey,
            primitive: args.primitive,
            read: x => x[key],
            readDto: x => x[dtoKey],
            toDto: args.toDto || (x => x),
            type: "reference:id",
            write: (x, v) => (x[key] as any) = v,
            writeDto: (x, v) => (x[dtoKey] as any) = v
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
            & Definition.Complex<T[K]>
            & Definition.Complex.Ethereal<T[K]>
            & Definition.Complex.Array<T[K]>
            & Definition.Reference<T[K]>
            & Definition.Reference.Id<T[K]>
            /**
             * [todo] missing:
             *  - children
             *  - reference
             */
            ;
        };
    }
}
