import { Entity } from "@entity-space/schema";
import { Primitive, Unbox } from "@entity-space/utils";

export type TypedEntitySelection<T = Entity, U = Unbox<T>> = {
    [K in keyof U]?: U[K] extends ReturnType<Primitive> ? true : TypedEntitySelection<U[K]> | true;
};

export type EntitySelection = {
    [key: string]: true | EntitySelection;
};

export function selectionToString(selection: EntitySelection): string {
    return `{ ${Object.entries(selection)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => (value === true ? key : `${key}: ${selectionToString(value)}`))
        .join(", ")} }`;
}
