import { Property } from "./property";

export type Instance<T> = Instance.Optional<T> & Instance.Required<T>;

export module Instance {
    export type Optional<T> = { [K in Property.Keys.Optional<T>]?: Property.ValueType<Property.WithKey.Optional<T, K>>; };
    export type Required<T> = { [K in Property.Keys.Required<T>]: Property.ValueType<Property.WithKey.Required<T, K>>; };

    export type Dto<T> = Dto.Optional<T> & Dto.Required<T>;

    export module Dto {
        export type Optional<T> = { [P in Property.Dto.OptionalKeys<T>]?: Property.Dto.ValueType<Property.Dto.OptionalWithKey<T, P>>; };
        export type Required<T> = { [P in Property.Dto.RequiredKeys<T>]: Property.Dto.ValueType<Property.Dto.RequiredWithKey<T, P>>; };
    }

    // export type Optional<T> = { [K in Property.OptionalKeys<T>]?: Property.ValueType<Property.OptionalWithKey<T, K>>; };
    // export type Required<T> = { [K in Property.RequiredKeys<T>]: Property.ValueType<Property.RequiredWithKey<T, K>>; };

    // export type Dto<T> = Dto.Optional<T> & Dto.Required<T>;

    // export module Dto {
    //     export type Optional<T> = { [P in Property.Dto.OptionalKeys<T>]?: Property.Dto.ValueType<Property.Dto.OptionalWithKey<T, P>>; };
    //     export type Required<T> = { [P in Property.Dto.RequiredKeys<T>]: Property.Dto.ValueType<Property.Dto.RequiredWithKey<T, P>>; };
    // }
}
