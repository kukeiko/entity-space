interface Attributes {
    filterable: true;
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

    // [todo] i have a feeling that we should kick this
    export type IsFilterable = Has<"filterable">;
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
        filterable: true,
        indexable: true,
        iterable: true,
        navigable: true,
        unique: true,
    };

    export function all(): Attribute[] {
        return Object.keys(attributesMap) as Attribute[];
    }

    export function set<T extends object, A extends Attribute>(property: T, attribute: A, value: Attributes[A]): T & Has<A> {
        (property as any)[attribute] = value;

        return property as any;
    }

    export function has<A extends Attribute>(property: any, attribute: A): property is Has<A> {
        return property?.[attribute] === true;
    }

    export function includes<A extends Attribute>(attributes: string[], attribute: A): attributes is A[] {
        return attributes.indexOf(attribute) !== -1;
    }
}
