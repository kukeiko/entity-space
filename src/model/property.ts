import { Class, Primitive } from "../utils";

export type Discriminant = string | number;

// export type PropertyValueType = Primitive[] | Discriminant[] | Class[];
export type PropertyValueType = Primitive | Discriminant | Class | Class[];

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
// export interface WriteOnlyAttribute {
//     writeOnly: true;
// }

export type AllAttributes = DiscriminatorAttribute | NullableAttribute | IdAttribute | ArrayAttribute | RequiredAttribute | ReadOnlyAttribute;

export function define<V extends PropertyValueType, O extends Partial<AllAttributes>>(valueType: V, options?: O): Property<V> & O {
    return { valueType, ...(options ?? {}) } as Property<V> & O;
}
