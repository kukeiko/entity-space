import {
    Class,
    EnumPrimitive,
    LiteralPrimitive,
    Path,
    Primitive,
    entryValueIs,
    enumToPrimitive,
    isDefined,
    literalToPrimitive,
} from "@entity-space/utils";
import { isPlainObject } from "lodash";
import { PackedEntitySelection } from "../../selection/entity-selection";
import { Entity } from "../entity";
import { RelationshipType } from "../schema/entity-relation-property";
import { SelectEntity } from "../select-entity-type";
import { EntityBlueprintInstance } from "./entity-blueprint-instance.type";
import {
    ArrayAttribute,
    BlueprintProperty,
    ComputedAttribute,
    CreatableAttribute,
    DtoAttribute,
    EntityAttribute,
    IdAttribute,
    InboundAttribute,
    NullableAttribute,
    OptionalAttribute,
    OutboundAttribute,
    ReadonlyAttribute,
    UnionAttribute,
    isProperty,
} from "./entity-blueprint-property";

export interface EntityBlueprintMetadata {
    name?: string;
    sort?: (a: Entity, b: Entity) => number;
    computed: {
        select: PackedEntitySelection<Entity>;
        requires?: PackedEntitySelection<Entity>;
        compute: (entity: Entity) => void;
    }[];
}

const blueprints = new Map<Class | Class[], EntityBlueprintMetadata>();

export function getAllEntityBlueprintMetadata(): Map<Class | Class[], EntityBlueprintMetadata> {
    return new Map(blueprints.entries());
}

export function getEntityBlueprintMetadata(type: Class | Class[]): EntityBlueprintMetadata {
    const metadata = blueprints.get(type);

    if (!metadata) {
        const typeName = Array.isArray(type) ? type.map(type => type.name).join(",") : type.name;
        throw new Error(`no blueprint metadata found for ${typeName}. did you forget to call register()?`);
    }

    return metadata;
}

export function isEntityBlueprint(value: any): value is Class | Class[] {
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
    export type Type<T> = EntityBlueprintInstance<T>;

    interface RegisterOptions<T> {
        name?: string;
        sort?: (a: T, b: T) => number;
    }

    export function register<T extends Class[] | Class>(blueprint: T, options: RegisterOptions<Type<T>> = {}): void {
        blueprints.set(blueprint, {
            name: options.name,
            sort: options.sort as ((a: Entity, b: Entity) => number) | undefined,
            computed: [],
        });
    }

    export function computed<T, R extends PackedEntitySelection<EntityBlueprint.Type<T>>>(
        blueprint: Class<T>,
        {
            hydrate,
            requires,
            select,
        }: {
            requires?: R | PackedEntitySelection<EntityBlueprint.Type<T>>;
            select: PackedEntitySelection<EntityBlueprint.Type<T>>;
            hydrate: (entity: SelectEntity<EntityBlueprint.Type<T>, R>) => void;
        },
    ): void {
        const metadata = blueprints.get(blueprint);

        if (!metadata) {
            throw new Error(`register(...) must be called before computed(...)`);
        }

        metadata.computed.push({ compute: hydrate as (entity: Entity) => void, requires, select });
    }

    export const array = true;
    export const creatable = true;
    export const nullable = true;
    export const optional = true;
    export const readonly = true;
    export const unique = true;
    export const inbound = true;
    export const outbound = true;

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
        ArrayAttribute &
            DtoAttribute &
            NullableAttribute &
            OptionalAttribute &
            ReadonlyAttribute &
            CreatableAttribute &
            ComputedAttribute
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

    export function literal<V extends string | number, O extends PrimitiveOptions>(
        value: V,
        options?: O,
    ): BlueprintProperty<LiteralPrimitive<V>> & O {
        return { valueType: literalToPrimitive(value), ...(options ?? {}) } as any;
    }

    export function discriminator<V extends string | number, O extends PrimitiveOptions>(
        value: V,
        options?: O,
    ): BlueprintProperty<LiteralPrimitive<V>> & O {
        return { valueType: literalToPrimitive(value), ...(options ?? {}), discriminator: true } as any;
    }

    export function enumeration<T extends Record<string, any>, O extends PrimitiveOptions>(
        valueType: T,
        options?: O,
    ): BlueprintProperty<EnumPrimitive<T[keyof T]>> & UnionAttribute & O {
        return { valueType: enumToPrimitive(valueType), ...{ ...(options ?? {}), union: true } } as any;
    }

    type EmbeddedEntityOptions = Partial<
        ArrayAttribute & DtoAttribute & NullableAttribute & OptionalAttribute & ReadonlyAttribute
    >;

    type JoinedEntityOptions = Partial<
        ArrayAttribute & DtoAttribute & NullableAttribute & ReadonlyAttribute & OutboundAttribute & InboundAttribute
    >;

    type InstanceTypeHelper<T> = T extends readonly Class[]
        ? T[number] extends infer C
            ? C extends Class
                ? InstanceType<C>
                : never
            : never
        : T extends Class
          ? InstanceType<T>
          : never;

    export function entity<V extends Class | Class[], O extends EmbeddedEntityOptions>(
        valueType: V,
        options?: O,
    ): BlueprintProperty<V> & EntityAttribute & O;
    export function entity<V extends Class | Class[], O extends JoinedEntityOptions>(
        valueType: V,
        from: Path | Path[] | BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[],
        to:
            | Path
            | Path[]
            | ((other: InstanceTypeHelper<V>) => BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[]),
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
