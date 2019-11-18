export type Attribute
    = "filterable"
    | "iterable"
    | "unique";

const attributesMap: Record<Attribute, true> = {
    filterable: true,
    iterable: true,
    unique: true
};

export function allAttributes(): Attribute[] {
    return Object.keys(attributesMap) as Attribute[];
}

export type WithAttribute<F extends Attribute> = Record<F, true>;

export function setAttribute<T extends object, A extends Attribute>(property: T, attribute: A): T & WithAttribute<A> {
    (property as any)[attribute] = true;

    return property as any;
}

export function hasAttribute<A extends Attribute>(property: any, attribute: A): property is WithAttribute<A> {
    return property?.[attribute] === true;
}

export type IncludesAttribute<T extends string[], A extends Attribute> = undefined extends T ? false : A extends T[number] ? true : false;

export function includesAttribute<A extends Attribute>(attributes: string[], attribute: A): attributes is A[] {
    return attributes.indexOf(attribute) !== -1;
}
