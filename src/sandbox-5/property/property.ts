import { Instance } from "../instance";

export class PropertyBase<K extends string, V, N extends boolean, F extends PropertyBase.Flags[]> {
    constructor(name: K, nullable: N, flags: F) {
        this.name = name;
        this.nullable = nullable;
        this.creatable = flags.includes("creatable") as PropertyBase<K, V, N, F>["creatable"];
        this.patchable = flags.includes("patchable") as PropertyBase<K, V, N, F>["patchable"];
        this.unique = flags.includes("unique") as PropertyBase<K, V, N, F>["unique"];
        this.flags = flags;
        Object.freeze(this.flags);
    }

    readonly name: K;
    readonly flags: F;
    readonly nullable: N;
    readonly creatable: F extends never ? false : PropertyBase.Flags.Creatable extends F[number] ? true : false;
    readonly patchable: F extends never ? false : PropertyBase.Flags.Patchable extends F[number] ? true : false;
    readonly unique: F extends never ? false : PropertyBase.Flags.Unique extends F[number] ? true : false;

    read(instance: Record<K, N extends true ? V | null : V>): N extends true ? V | null : V {
        return instance[this.name];
    }
}

export module PropertyBase {
    export type Flags = Flags.Creatable | Flags.Patchable | Flags.Unique;

    export module Flags {
        export type Creatable = "creatable";
        export type Patchable = "patchable";
        export type Unique = "unique";
    }
}

// export class StringProperty<K extends string, N extends boolean, F extends PropertyBase.Flags = never> extends PropertyBase<K, string, N, F> {
export class StringProperty<K extends string, N extends boolean, F extends PropertyBase.Flags[]> extends PropertyBase<K, string, N, F> {
    constructor(name: K, nullable: N, flags: F) {
        super(name, nullable, flags);
    }

    type = "string";
}

export interface NavigableProperty<N> {
    navigated: N;
}

export class ReferenceProperty<K extends string, V, N extends boolean, F extends PropertyBase.Flags[]> extends PropertyBase<K, Instance<Partial<V>>, N, F> implements NavigableProperty<V> {
    // export class ReferenceProperty<K extends string, V, N extends boolean, F extends PropertyBase.Flags[]> extends PropertyBase<K, Instance<V>, N, F> implements NavigableProperty<V> {
    constructor(name: K, referenced: V, nullable: N, flags: F) {
        super(name, nullable, flags);
        this.referenced = referenced;
        this.navigated = referenced;
    }

    navigated: V;
    referenced: V;
    type: "reference" = "reference";
}

export class NullableReferenceProperty<K extends string, V, F extends PropertyBase.Flags[]> extends PropertyBase<K, Instance<V>, true, F> {
    constructor(name: K, referenced: V, flags: F) {
        super(name, true, flags);
        this.referenced = referenced;
    }

    referenced: V;
    type = "reference";
}

let nameProperty = new StringProperty("name", true, ["creatable", "patchable"]);
nameProperty.read({ name: "foo" }) ?.charAt(2);
nameProperty.nullable;
nameProperty.creatable;
nameProperty.patchable;
nameProperty.unique;

// let refProperty = new 

let stringInstance = new String();

type Foo = ReturnType<StringConstructor>;
