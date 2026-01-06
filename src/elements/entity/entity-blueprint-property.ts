import { Class, Primitive } from "@entity-space/utils";
import { Entity } from "./entity";
import { ContainerType } from "./entity-property";
import { RelationshipType } from "./entity-relation-property";

export type BlueprintPropertyValue = Primitive | Class;

export interface BlueprintProperty<V extends BlueprintPropertyValue = BlueprintPropertyValue> {
    valueType: V;
}

export interface ArrayAttribute {
    array: true;
}

export interface IdAttribute {
    id: true;
}

export interface NullableAttribute {
    nullable: true;
}

export interface ReadonlyAttribute {
    readonly: true;
}

export interface OutboundAttribute {
    outbound: true;
}

export interface InboundAttribute {
    inbound: true;
}

export interface CreatableAttribute {
    creatable: true;
}

export interface EntityAttribute {
    entity: true;
    relationshipType?: RelationshipType;
    from: string | string[] | BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[];
    to: string | string[] | ((instance: Entity) => BlueprintProperty<Primitive> | BlueprintProperty<Primitive>[]);
}

export interface OptionalAttribute {
    optional: true;
}

export interface UnionAttribute {
    union: true;
}

export interface UniqueAttribute {
    unique: true;
}

export interface DtoAttribute {
    dto: string;
}

export type AllAttributes =
    | ArrayAttribute
    | CreatableAttribute
    | DtoAttribute
    | EntityAttribute
    | IdAttribute
    | NullableAttribute
    | OptionalAttribute
    | OutboundAttribute
    | InboundAttribute
    | ReadonlyAttribute
    | UnionAttribute
    | UniqueAttribute;

export function isProperty(value: unknown): value is BlueprintProperty {
    return (value as BlueprintProperty | undefined | null)?.valueType != null;
}

type DistributedKeyOf<T> = T extends any ? keyof T : never;

export function hasAttribute<P extends BlueprintProperty, K extends DistributedKeyOf<AllAttributes>>(
    attribute: K,
    property: P,
): property is P & Extract<AllAttributes, Record<K, true | string>> {
    return (
        attribute in property &&
        ((property as any)[attribute] === true || typeof (property as any)[attribute] === "string")
    );
}

export function toContainerType(property: BlueprintProperty): ContainerType | undefined {
    if (hasAttribute("array", property)) {
        return ContainerType.Array;
    }

    return undefined;
}
