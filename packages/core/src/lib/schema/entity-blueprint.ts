import { Class, Primitive, isDefined } from "@entity-space/utils";
import {
    ArrayAttribute,
    BlueprintProperty,
    IdAttribute,
    OptionalAttribute,
    RelationAttribute,
    isProperty,
} from "./entity-blueprint-property";

// [todo] changed it to Symbol.for() instead of just Symbol() to fix an issue where, in a test,
// i imported the decorate via absolute path instead of relative. the test failed because of it,
// since this file actually existes twice, and there were two distinct symbols for the same blueprint.
// => i.e. i knew this was going to happen and I wanted to test it failing, now it did, so I need to
// apply Symbol.for() for all other places where symbols are used
const BLUEPRINT_METADATA_KEY = Symbol.for("blueprint-metadata");

interface BlueprintMetadata {
    id: string;
    key?: string | string[];
    indexes?: Record<string, string | string[]>;
}

// [todo] investigate alternative to using decorators: special property on each
// blueprint instance (which would then also exist on each entity). we could
// put quite a lot of useful stuff in there, like "lastCachedAt", "isPersisted" and more!
export function EntityBlueprint(options: BlueprintMetadata) {
    return (type: Class) => {
        const metadata: BlueprintMetadata = { ...options };
        Reflect.defineMetadata(BLUEPRINT_METADATA_KEY, metadata, type);
    };
}

function findBlueprintMetadata(type: Class): BlueprintMetadata | undefined {
    return Reflect.getMetadata(BLUEPRINT_METADATA_KEY, type);
}

export function getEntityBlueprintMetadata(type: Class): BlueprintMetadata {
    const metadata = findBlueprintMetadata(type);

    if (!metadata) {
        throw new Error(`no blueprint metadata found for ${type.name}, please check if the class is decorated`);
    }

    return metadata;
}

export function isEntityBlueprint(value: any): value is Class {
    return Reflect.getMetadata(BLUEPRINT_METADATA_KEY, value) !== void 0;
}

export type NamedProperty = BlueprintProperty & { name: string };

export function getNamedProperties(blueprint: Class): NamedProperty[] {
    const instance = new blueprint();

    return Object.entries(instance)
        .map(([name, property]) => (isProperty(property) ? { ...property, name } : void 0))
        .filter(isDefined);
}

export function toPropertyRecord(instance: Record<string, unknown>): Record<string, BlueprintProperty> {
    return Object.entries(instance).reduce((properties, [key, property]) => {
        if (isProperty(property)) {
            properties[key] = property;
        }

        return properties;
    }, {} as Record<string, BlueprintProperty>);
}

export module EntityBlueprint {
    type IdOptions = {
        writable?: true;
        dto?: string;
    };

    export function id<V extends Primitive = typeof Number, O extends IdOptions = {}>(
        valueType?: V,
        options?: O
    ): BlueprintProperty<V> & IdAttribute & O {
        return { valueType: valueType ?? Number, id: true, ...(options ?? {}) } as any;
    }

    type StringOptions = {
        writable?: true;
        dto?: string;
        nullable?: true;
        index?: true;
    };

    export function string<O extends StringOptions>(options?: O): BlueprintProperty<typeof String> & O {
        return { valueType: String, ...(options ?? {}) } as any;
    }

    type NumberOptions = {
        writable?: true;
        dto?: string;
        nullable?: true;
        index?: true;
    };

    export function number<O extends NumberOptions>(options?: O): BlueprintProperty<typeof Number> & O {
        return { valueType: Number, ...(options ?? {}) } as any;
    }

    type BooleanOptions = {
        writable?: true;
        dto?: string;
        nullable?: true;
    };

    export function boolean<O extends BooleanOptions>(options?: O): BlueprintProperty<typeof Boolean> & O {
        return { valueType: Boolean, ...(options ?? {}) } as any;
    }

    type RelatedEntityOptions = {
        dto?: string;
        nullable?: true;
    };

    type EntityOptions = {
        dto?: string;
        nullable?: true;
        optional?: true;
    };

    export function entity<V extends Class, O extends EntityOptions>(
        valueType: V,
        options?: O
    ): BlueprintProperty<V> & O;
    export function entity<V extends Class, O extends RelatedEntityOptions>(
        valueType: V,
        from: string | string[] | BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[],
        to:
            | string
            | string[]
            | ((other: InstanceType<V>) => BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[]),
        options?: O
    ): BlueprintProperty<V> & RelationAttribute & OptionalAttribute & O;
    export function entity(...args: any[]): any {
        if (args.length === 2) {
            const [valueType, options] = args;
            return { valueType, ...(options ?? {}) };
        }

        const [valueType, from, to, options] = args;
        return { valueType, from, to, optional: true, relation: true, ...(options ?? {}) } as any;
    }

    type RelatedEntitiesOptions = {
        dto?: string;
        nullable?: true;
    };

    export function entities<V extends Class, O extends RelatedEntitiesOptions>(
        valueType: V,
        from: string | string[] | BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[],
        to:
            | string
            | string[]
            | ((other: InstanceType<V>) => BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[]),
        options?: O
    ): BlueprintProperty<V> & ArrayAttribute & RelationAttribute & OptionalAttribute & O {
        return { valueType, array: true, from, to, relation: true, optional: true, ...(options ?? {}) } as any;
    }
}
