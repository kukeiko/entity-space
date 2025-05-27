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

type UndefinedIfOptional<P, V> = P extends { $optional: true } ? V | undefined : V;

export type WherePrimitiveShapeInstance<S, U> =
    | (S extends WhereEqualsShape ? UndefinedIfOptional<S, { type: "$equals"; value: U }> : never)
    | (S extends WhereNotEqualsShape ? UndefinedIfOptional<S, { type: "$notEquals"; value: U }> : never)
    | (S extends WhereInArrayShape ? UndefinedIfOptional<S, { type: "$inArray"; value: U[] }> : never)
    | (S extends WhereNotInArrayShape ? UndefinedIfOptional<S, { type: "$notInArray"; value: U[] }> : never)
    | (S extends WhereInRangeShape
          ? UndefinedIfOptional<S, { type: "$inRange"; value: [U | undefined, U | undefined] }>
          : never);

type WhereEntityShapePropertyInstance<S, E, U = Unbox<E>> =
    U extends ReturnType<Primitive> ? WherePrimitiveShapeInstance<S, U> : WhereEntityShapeInstance<S, U>;

export type WhereEntityShapeInstance<S = WhereEntityShape, E = Entity> = {
    [K in keyof (S | E)]-?: WhereEntityShapePropertyInstance<S[K], E[K]>;
};
