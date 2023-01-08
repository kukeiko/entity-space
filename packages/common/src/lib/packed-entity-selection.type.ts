import { Unbox } from "@entity-space/utils";
import { Entity } from "./entity.type";

export type PackedEntitySelection<T = Entity, U = Unbox<T>> =
    | true
    | {
          [K in keyof U]?: U[K] extends number | string | undefined | null
              ? true
              : PackedEntitySelection<Exclude<U[K], undefined | null>> | true;
      };
