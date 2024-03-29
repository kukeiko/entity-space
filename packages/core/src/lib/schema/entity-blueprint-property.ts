import { Class, Primitive } from "@entity-space/utils";
import { Metadata, MetadataReference } from "./entity-blueprint-instance.type";

export type Discriminant = string | number;
export type MetadataToken = Class | Metadata | MetadataReference;
// [todo] should we add "Primitive[]", so we support arrays of mixed primitive types?
// that would also let us get rid of "nullable" attribute, as user could do define([Number, Null]) (where "Null" is not standard, but provided by entity-space)
export type BlueprintPropertyValue = Primitive | Discriminant | MetadataToken | MetadataToken[];
// export type PropertyValueType = Primitive | Discriminant | Class | Class[] | Metadata | Metadata[] | MetadataReference | MetadataReference[];

export interface BlueprintProperty<V extends BlueprintPropertyValue = BlueprintPropertyValue> {
    valueType: V;
}

export interface ArrayAttribute {
    array: true;
}

export interface DiscriminatorAttribute {
    discriminator: true;
}

export interface IdAttribute {
    id: true;
}

export interface IndexAttribute {
    index: true;
}

export interface NullableAttribute {
    nullable: true;
}

export interface ReadOnlyAttribute {
    readOnly: true;
}

export interface RelationAttribute {
    relation: true;
    from: string | string[] | BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[];
    to:
        | string
        | string[]
        | ((instance: Record<string, unknown>) => BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[]);
}

export interface OptionalAttribute {
    optional: true;
}

export interface UniqueAttribute {
    unique: true;
}

export interface DtoAttribute {
    dto: string;
}

export interface WritableAttribute {
    writable: true;
}

// [todo] sadly, we can't support writeOnly yet, as otherwise intellisense for Expansion<Instance<MyModel>> won't work :(
// reason being that we would have to filter out properties that are write only, so we need a { [K in keyof T] } mapping,
// which just kills intellisense. not sure why, probably a limitation of typescript?
// [update] actually, we could support it - expand will just have a nonsensical suggestion. in addition, writeOnly would then
// always have to be optional though?
// export interface WriteOnlyAttribute {
//     writeOnly: true;
// }

export type AllAttributes =
    | ArrayAttribute
    | DiscriminatorAttribute
    | IdAttribute
    | IndexAttribute
    | NullableAttribute
    | OptionalAttribute
    | ReadOnlyAttribute
    | RelationAttribute
    | UniqueAttribute
    | DtoAttribute
    | WritableAttribute;

// [todo] user can put anything as O & "find references" doesn't work
/**
 * @deprecated use EntityBlueprint.id/number/entity... instead
 */
export function define<V extends BlueprintPropertyValue, O extends Partial<AllAttributes>>(
    valueType: V,
    options?: O
): BlueprintProperty<V> & O {
    return { valueType, ...(options ?? {}) } as BlueprintProperty<V> & O;
}

export function isProperty(value: unknown): value is BlueprintProperty {
    return (value as BlueprintProperty | undefined | null)?.valueType != null;
}

type DistributedKeyOf<T> = T extends any ? keyof T : never;

// [todo] does not work for "dto"
export function hasAttribute<P extends BlueprintProperty, K extends DistributedKeyOf<AllAttributes>>(
    attribute: K,
    property: P
): property is P & Extract<AllAttributes, Record<K, true>>;
// currying signature
export function hasAttribute<K extends DistributedKeyOf<AllAttributes>>(
    attribute: K
): <P extends BlueprintProperty>(property: P) => property is P & Extract<AllAttributes, Record<K, true>>;
export function hasAttribute(attribute: string, property?: Record<string, any>): any {
    if (property === void 0) {
        return (property: Record<string, any>) => property[attribute] === true;
    }

    return property[attribute] === true;
}

export function hasDtoAttribute<P extends BlueprintProperty>(property: P): property is P & DtoAttribute {
    return typeof (property as any as DtoAttribute).dto === "string";
}
