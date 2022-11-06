import { Entity } from "./entity.type";

// [todo] don't really like the name. would rather have just "Expansion" instead,
// and find another name for the class "Expansion" (in core/../expansion.ts)
export type EntitySelectionValue<T = Entity> =
    | true
    | {
          [K in keyof T]?: T[K] extends number | string | undefined
              ? true
              : T[K] extends any[] | undefined
              ? EntitySelectionValue<Exclude<T[K], undefined>[number]> | true
              : EntitySelectionValue<T[K]> | true;
      };
