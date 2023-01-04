import { Entity } from "./entity.type";

export type EntitySelectionValue<T = Entity> =
    | true
    | {
          [K in keyof T]?: T[K] extends number | string | undefined
              ? true
              : T[K] extends any[] | undefined
              ? EntitySelectionValue<Exclude<T[K], undefined>[number]> | true
              : EntitySelectionValue<T[K]> | true;
      };
