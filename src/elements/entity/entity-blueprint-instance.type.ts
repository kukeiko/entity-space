import { Class, DeepPartial, Primitive, Unbox } from "@entity-space/utils";
import {
    ArrayAttribute,
    BlueprintProperty,
    CreatableAttribute,
    IdAttribute,
    NullableAttribute,
    OptionalAttribute,
    ReadonlyAttribute,
} from "./entity-blueprint-property";

type BoxIfContainer<P, V> = P extends ArrayAttribute ? V[] : V;
type NullIfNullable<P, V> = P extends NullableAttribute ? V | null : V;

type PropertyValueType<V> = V extends Primitive
    ? ReturnType<V>
    : V extends Class
      ? EntityBlueprintInstance<InstanceType<V>>
      : never;

type RequiredPropertyKeys<T> = Exclude<
    { [K in keyof T]: T[K] extends OptionalAttribute ? never : K }[keyof T],
    undefined
>;

type InstanceDefault<T> = {
    [K in keyof T]?: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], PropertyValueType<Unbox<V>>>>
        : T[K];
};

type InstanceRequired<T> = {
    [K in RequiredPropertyKeys<T>]: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], PropertyValueType<Unbox<V>>>>
        : T[K];
};

export type EntityBlueprintInstance<T> = InstanceDefault<T> & InstanceRequired<T>;

type CreatablePropertyValueType<V> = V extends Primitive
    ? ReturnType<V>
    : V extends Class
      ? DeepPartial<EntityBlueprintCreatableInstance<InstanceType<V>>>
      : never;

type CreatableRequiredPropertyKeys<T> = Exclude<
    {
        [K in keyof T]: T[K] extends OptionalAttribute
            ? never
            : T[K] extends ReadonlyAttribute
              ? T[K] extends CreatableAttribute
                  ? K
                  : never
              : K;
    }[keyof T],
    undefined
>;

type CreatableInstanceDefault<T> = {
    [K in keyof T]?: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], CreatablePropertyValueType<Unbox<V>>>>
        : T[K];
};

type CreatableInstanceRequired<T> = {
    [K in CreatableRequiredPropertyKeys<T>]: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], CreatablePropertyValueType<Unbox<V>>>>
        : T[K];
};

export type EntityBlueprintCreatableInstance<T> = CreatableInstanceDefault<T> & CreatableInstanceRequired<T>;

type UpdatablePropertyValueType<V> = V extends Primitive
    ? ReturnType<V>
    : V extends Class
      ? EntityBlueprintUpdatableInstance<InstanceType<V>>
      : never;

type UpdatableRequiredPropertyKeys<T> = Exclude<
    {
        [K in keyof T]: T[K] extends IdAttribute ? K : never;
    }[keyof T],
    undefined
>;

type UpdatableInstanceDefault<T> = {
    [K in keyof T]?: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], UpdatablePropertyValueType<Unbox<V>>>>
        : T[K];
};

type UpdatableInstanceRequired<T> = {
    [K in UpdatableRequiredPropertyKeys<T>]: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], UpdatablePropertyValueType<Unbox<V>>>>
        : T[K];
};

export type EntityBlueprintUpdatableInstance<T> = UpdatableInstanceDefault<T> & UpdatableInstanceRequired<T>;

type SavablePropertyValueType<V> = V extends Primitive
    ? ReturnType<V>
    : V extends Class
      ? EntityBlueprintSavableInstance<InstanceType<V>>
      : never;

type SavableRequiredCreatablePropertyKeys<T> = Exclude<
    {
        [K in keyof T]: T[K] extends OptionalAttribute
            ? never
            : T[K] extends ReadonlyAttribute
              ? T[K] extends CreatableAttribute
                  ? K
                  : never
              : K;
    }[keyof T],
    undefined
>;

type SavableRequiredUpdatablePropertyKeys<T> = Exclude<
    {
        [K in keyof T]: T[K] extends IdAttribute ? K : never;
    }[keyof T],
    undefined
>;

type SavableInstanceDefault<T> = {
    [K in keyof T]?: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], SavablePropertyValueType<Unbox<V>>>>
        : T[K];
};

type SavableInstanceRequiredCreatable<T> = {
    [K in SavableRequiredCreatablePropertyKeys<T>]: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], SavablePropertyValueType<Unbox<V>>>>
        : T[K];
};

type SavableInstanceRequiredUpdatable<T> = {
    [K in SavableRequiredUpdatablePropertyKeys<T>]: T[K] extends BlueprintProperty<infer V>
        ? NullIfNullable<T[K], BoxIfContainer<T[K], SavablePropertyValueType<Unbox<V>>>>
        : T[K];
};

export type EntityBlueprintSavableInstance<T> = SavableInstanceDefault<T> &
    (SavableInstanceRequiredUpdatable<T> | SavableInstanceRequiredCreatable<T>);
