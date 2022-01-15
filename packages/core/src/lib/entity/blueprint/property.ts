import { Class, Primitive } from "@entity-space/utils";
import { Metadata, MetadataReference } from "./instance";

export type Discriminant = string | number;
export type MetadataToken = Class | Metadata | MetadataReference;
export type PropertyValueType = Primitive | Discriminant | MetadataToken | MetadataToken[];
// export type PropertyValueType = Primitive | Discriminant | Class | Class[] | Metadata | Metadata[] | MetadataReference | MetadataReference[];

export interface Property<V extends PropertyValueType = PropertyValueType> {
    valueType: V;
}

export interface DiscriminatorAttribute {
    discriminator: true;
}

export interface NullableAttribute {
    nullable: true;
}

export interface IdAttribute {
    id: true;
}

export interface ArrayAttribute {
    array: true;
}

export interface RequiredAttribute {
    required: true;
}

export interface ReadOnlyAttribute {
    readOnly: true;
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
    | DiscriminatorAttribute
    | NullableAttribute
    | IdAttribute
    | ArrayAttribute
    | RequiredAttribute
    | ReadOnlyAttribute;

export function define<V extends PropertyValueType, O extends Partial<AllAttributes>>(
    valueType: V,
    options?: O
): Property<V> & O {
    return { valueType, ...(options ?? {}) } as Property<V> & O;
}
