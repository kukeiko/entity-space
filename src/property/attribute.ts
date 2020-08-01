interface Attributes {
    discriminant: true;
    filterable: true;
    identifier: true;
    indexable: true;
    iterable: {
        sorted: boolean;
    };
    navigable: true;
    unique: true;
}

export type Attribute = keyof Attributes;

export module Attribute {
    export type Has<A extends Attribute> = Record<A, Attributes[A]>;

    export type IsDiscriminant = Has<"discriminant">;
    // [todo] i have a feeling that we should kick this
    export type IsFilterable = Has<"filterable">;
    export type IsId = Has<"identifier">;
    /**
     * [todo] this one is a bit of a black sheep. all other attributes define behaviour,
     * whereas this describes storage optimization (as it would be used for creating indices in a cache)
     */
    export type IsIndexable = Has<"indexable">;
    export type IsIterable = Has<"iterable">;
    export type IsNavigable = Has<"navigable">;
    export type IsUnique = Has<"unique">;

    export module Iterable {
        export type Value = Attributes["iterable"];
    }

    const attributesMap: Record<Attribute, true> = {
        discriminant: true,
        filterable: true,
        identifier: true,
        indexable: true,
        iterable: true,
        navigable: true,
        unique: true,
    };

    // [todo] move into separate file
    export function all(): Attribute[] {
        return Object.keys(attributesMap) as Attribute[];
    }

    // [todo] move into separate file
    export function set<T extends object, A extends Attribute>(property: T, attribute: A, value: Attributes[A]): T & Has<A> {
        (property as any)[attribute] = value;

        return property as any;
    }

    // [todo] move into separate file
    // [todo] doesn't work for attributes that dont have "true" as their value (e.g. "iterable")
    export function has<A extends Attribute>(property: any, attribute: A): property is Has<A> {
        return property?.[attribute] === true;
    }

    // [todo] move into separate file
    export function includes<A extends Attribute>(attributes: string[], attribute: A): attributes is A[] {
        return attributes.indexOf(attribute) !== -1;
    }
}
