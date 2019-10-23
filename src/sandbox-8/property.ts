import { Primitive } from "./lang";

export interface Property<K extends string = string, V = any> {
    key: K;
    value: V;
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

export type PartialPropertiesOf<T, P = Property> = {
    [K in PartialPropertyKeysOf<T, P>]?: T[K];
};

export type RequiredPropertiesOf<T, P = Property> = {
    [K in RequiredPropertyKeysOf<T, P>]: T[K];
};

export type PropertiesOf<T, P = Property>
    = PartialPropertiesOf<T, P>
    & RequiredPropertiesOf<T, P>;

export type PropertyWithMappedValue<P extends Property, V> = Omit<P, "value"> & { value: V };
export type MixinPropertyWithMappedValue<P extends Property, V> = Record<P["key"], PropertyWithMappedValue<P, V>>;

export type DefaultValueOfProperty<P extends Property>
    = P["value"] extends Primitive ? P["value"]
    : {};
