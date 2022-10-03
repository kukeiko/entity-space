import { Entity } from "./entity.type";

// [todo] don't really like the name. would rather have just "Expansion" instead,
// and find another name for the class "Expansion" (in core/../expansion.ts)
export type ExpansionValue<T = Entity> =
    | true
    | {
          [K in keyof T]?: T[K] extends number | string | undefined
              ? true
              : T[K] extends any[] | undefined
              ? ExpansionValue<Exclude<T[K], undefined>[number]> | true
              : ExpansionValue<T[K]> | true;
      };
