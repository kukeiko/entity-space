import { entryValueIs, isDefined, Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../entity/entity";

export type TypedEntitySelection<T = Entity, U = Unbox<T>> = {
    [K in keyof U]?: U[K] extends ReturnType<Primitive> ? true : PackedEntitySelection<U[K]>;
};

export type PackedEntitySelection<T = Entity, U = Unbox<T>> = {
    [K in keyof U]?: U[K] extends ReturnType<Primitive> ? true : PackedEntitySelection<U[K]> | true;
};

export type EntityRelationSelection = {
    [key: string]: EntityRelationSelection;
};

export type EntitySelection = {
    [key: string]: true | EntitySelection;
};

export function selectionToString(selection: EntitySelection | PackedEntitySelection): string {
    return `{ ${Object.entries(selection)
        .filter(entryValueIs(isDefined))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => (value === true ? key : `${key}: ${selectionToString(value)}`))
        .join(", ")} }`;
}
