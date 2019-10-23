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
