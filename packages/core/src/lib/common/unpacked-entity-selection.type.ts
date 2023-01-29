import { Unbox } from "@entity-space/utils";
import { Entity } from "./entity.type";

export type UnpackedEntitySelection<T = Entity, U = Unbox<T>> = {
    [K in keyof U]?: U[K] extends number | string | boolean | undefined | null ? true : UnpackedEntitySelection<U[K]>;
};
