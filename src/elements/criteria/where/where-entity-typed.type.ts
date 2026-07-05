import { Primitive, Unbox } from "@entity-space/utils";
import { Entity } from "../../entity/entity";
import {
    WhereEntityShape,
    WhereEqualsShape,
    WhereInArrayShape,
    WhereInRangeShape,
    WhereNotEqualsShape,
    WhereNotInArrayShape,
} from "./where-entity-shape.type";
import { WhereEquals, WhereInArray, WhereInRange, WhereNotEquals, WhereNotInArray } from "./where-entity.type";

type UndefinedIfOptional<P, V> = P extends { $optional: true } ? V | undefined : V;

type WherePrimitiveTyped<S, U> =
    | (S extends WhereEqualsShape ? WhereEquals<U> : never)
    | (S extends WhereNotEqualsShape ? WhereNotEquals<U> : never)
    | (S extends WhereInArrayShape ? WhereInArray<U> : never)
    | (S extends WhereNotInArrayShape ? WhereNotInArray<U> : never)
    | (S extends WhereInRangeShape ? WhereInRange<U> : never);

type WherePropertyTyped<S, E, U = Unbox<E>> =
    U extends ReturnType<Primitive> ? UndefinedIfOptional<S, WherePrimitiveTyped<S, U>> : WhereEntityTyped<S, U>;

export type WhereEntityTyped<S = WhereEntityShape, E = Entity> = {
    [K in keyof (S | E)]-?: WherePropertyTyped<S[K], E[K]>;
};
