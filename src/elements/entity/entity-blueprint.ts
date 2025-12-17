import { Class, CustomPrimitive, Path, Primitive, entryValueIs, enumToPrimitive, isDefined } from "@entity-space/utils";
import { isPlainObject } from "lodash";
import { Entity } from "./entity";
import {
    EntityBlueprintCreatableInstance,
    EntityBlueprintInstance,
    EntityBlueprintSavableInstance,
    EntityBlueprintUpdatableInstance,
} from "./entity-blueprint-instance.type";
import {
    ArrayAttribute,
    BlueprintProperty,
    CreatableAttribute,
    DtoAttribute,
    EntityAttribute,
    IdAttribute,
    NullableAttribute,
    OptionalAttribute,
    ParentAttribute,
    ReadonlyAttribute,
    isProperty,
} from "./entity-blueprint-property";
import { RelationshipType } from "./entity-relation-property";

interface EntityBlueprintMetadata {
    name: string;
    sort?: (a: Entity, b: Entity) => number;
}

const blueprints = new Map<Class, EntityBlueprintMetadata>();

export interface RegisterEntityBlueprintOptions<T> {
    name?: string;
    sort?: (a: EntityBlueprintInstance<T>, b: EntityBlueprintInstance<T>) => number;
}

export function getEntityBlueprintMetadata(type: Class): EntityBlueprintMetadata {
    const metadata = blueprints.get(type);

    if (!metadata) {
        throw new Error(`no blueprint metadata found for ${type.name}. did you forget to call register()?`);
    }

    return metadata;
}

export function isEntityBlueprint(value: any): value is Class {
    return blueprints.has(value);
}

export function toPropertyRecord(instance: Record<string, unknown>): Record<string, BlueprintProperty> {
    return Object.fromEntries(Object.entries(instance).filter(entryValueIs(isProperty)));
}

export type NamedProperty = BlueprintProperty & { name: string };

export function getNamedProperties(blueprint: Class): NamedProperty[] {
    const instance = new blueprint();

    return Object.entries(instance)
        .map(([name, property]) => (isProperty(property) ? { ...property, name } : void 0))
        .filter(isDefined);
}

export namespace EntityBlueprint {
    export type Instance<T> = EntityBlueprintInstance<T>;
    export type Creatable<T> = EntityBlueprintCreatableInstance<T>;
    export type Updatable<T> = EntityBlueprintUpdatableInstance<T>;
    export type Savable<T> = EntityBlueprintSavableInstance<T>;

    export function register<T>(blueprint: Class<T>, options: RegisterEntityBlueprintOptions<T> = {}): void {
        blueprints.set(blueprint, {
            name: options.name ?? blueprint.name,
            sort: options.sort as ((a: Entity, b: Entity) => number) | undefined,
        });
    }

    export const array = true;
    export const creatable = true;
    export const nullable = true;
    export const optional = true;
    export const readonly = true;
    export const unique = true;
    export const parent = true;

    type IdOptions = Partial<DtoAttribute & CreatableAttribute>;

    export function id<O extends IdOptions>(
        options?: O,
    ): BlueprintProperty<typeof Number> & IdAttribute & ReadonlyAttribute & O;
    export function id<O extends IdOptions, V extends Primitive = typeof Number>(
        valueType?: V,
        options?: O,
    ): BlueprintProperty<V> & IdAttribute & ReadonlyAttribute & O;
    export function id(...args: any[]): BlueprintProperty & IdAttribute & ReadonlyAttribute & IdOptions {
        const valueType: Primitive = isPlainObject(args[0]) || args.length === 0 ? Number : args[0];
        const options: IdOptions = (args.length === 1 ? args[0] : args[1]) ?? {};

        return { id: true, readonly: true, valueType, ...options };
    }

    type PrimitiveOptions = Partial<
        ArrayAttribute & DtoAttribute & NullableAttribute & OptionalAttribute & ReadonlyAttribute & CreatableAttribute
    >;

    export function string<O extends PrimitiveOptions>(options?: O): BlueprintProperty<typeof String> & O {
        return { valueType: String, ...(options ?? {}) } as any;
    }

    export function number<O extends PrimitiveOptions>(options?: O): BlueprintProperty<typeof Number> & O {
        return { valueType: Number, ...(options ?? {}) } as any;
    }

    export function boolean<O extends PrimitiveOptions>(options?: O): BlueprintProperty<typeof Boolean> & O {
        return { valueType: Boolean, ...(options ?? {}) } as any;
    }

    export function union<T extends Record<string, any>, O extends PrimitiveOptions>(
        valueType: T,
        options?: O,
    ): BlueprintProperty<CustomPrimitive<T[keyof T]>> & O {
        return { valueType: enumToPrimitive(valueType), ...(options ?? {}) } as any;
    }

    type EmbeddedEntityOptions = Partial<
        ArrayAttribute & DtoAttribute & NullableAttribute & OptionalAttribute & ReadonlyAttribute & ParentAttribute
    >;

    type JoinedEntityOptions = Partial<
        ArrayAttribute & DtoAttribute & NullableAttribute & ReadonlyAttribute & ParentAttribute
    >;

    export function entity<V extends Class, O extends EmbeddedEntityOptions>(
        valueType: V,
        options?: O,
    ): BlueprintProperty<V> & EntityAttribute & O;
    export function entity<V extends Class, O extends JoinedEntityOptions>(
        valueType: V,
        from: Path | Path[] | BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[],
        to: Path | Path[] | ((other: InstanceType<V>) => BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[]),
        options?: O,
    ): BlueprintProperty<V> & EntityAttribute & OptionalAttribute & O;
    export function entity(...args: any[]): BlueprintProperty<Class> & EntityAttribute {
        const valueType: Class = args[0];

        if (args.length <= 2) {
            // embedded relation path
            const options: EmbeddedEntityOptions = args[1];

            return {
                entity: true,
                valueType,
                from: [],
                to: [],
                ...(options ?? {}),
            };
        }

        // joined relation path
        const from: Path | Path[] | BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[] = args[1];
        const to: Path | Path[] | ((other: Entity) => BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[]) =
            args[2];
        const options: JoinedEntityOptions = args[3] ?? {};

        return {
            entity: true,
            relationshipType: RelationshipType.Joined,
            valueType,
            from,
            to,
            optional: true,
            ...(options ?? {}),
        } as BlueprintProperty<Class> & EntityAttribute;
    }
}
