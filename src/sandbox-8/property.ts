import { Primitive, Unbox } from "./lang";
import { Type } from "./type";

export interface Property<K extends string = string, V = any> {
    key: K;
    value: V;
}

export module Property {
    export function is(x?: any): x is Property {
        x = x || {};

        return typeof ((x as Property).key) === "string" && (x as Property).value != null;
    }
}

export type PartialPropertyKeysOf<T, P = Property> = ({
    [K in keyof T]: undefined extends T[K] ? (T[K] extends (Property & P) | undefined ? K : never) : never;
})[keyof T];

export type RequiredPropertyKeysOf<T, P = Property> = ({
    [K in keyof T]: T[K] extends (Property & P) ? K : never;
})[keyof T];

export type PropertyKeysOf<T, P = Property>
    = PartialPropertyKeysOf<T, P>
    | RequiredPropertyKeysOf<T, P>;

export type PickPartialProperties<T, P = Property> = {
    [K in PartialPropertyKeysOf<T, P>]?: T[K];
};

export type PropertyValue<T> = T extends Property<string, infer V> ? V : never;

/**
 * [todo] figuring out how the "Type" plays into this
 */
export type PickRequiredProperties<T, P = Property> = {
    [K in RequiredPropertyKeysOf<T, P>]:
    PropertyValue<T[K]> extends Primitive ? T[K]
    : Property extends P ? T[K]
    : PropertyWithMappedValue<T[K], Type & PickRequiredProperties<Unbox<PropertyValue<T[K]>>, P>>;
};

export type PickProperties<T, P = Property>
    = PickPartialProperties<T, P>
    & PickRequiredProperties<T, P>;

export type PropertyWithMappedValue<P extends Property, V> = Omit<P, "value"> & { value: V };
export type MixinPropertyWithMappedValue<P extends Property, V> = Record<P["key"], PropertyWithMappedValue<P, V>>;

export type DefaultValueOfProperty<P extends Property>
    = P["value"] extends Primitive ? P["value"]
    : {};

export function propertiesOf<T extends Type>(type: T): Record<string, Property> {
    let properties: Record<string, Property> = {};

    for (let k in type) {
        let candidate = type[k];

        if (Property.is(candidate)) {
            properties[k] = candidate;
        }
    }

    return properties;
}
