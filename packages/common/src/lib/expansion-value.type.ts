import { Entity } from "./entity.type";

export type ExpansionValue<T = Entity> = {
    [K in keyof T]?: T[K] extends number | string | undefined
        ? true
        : T[K] extends any[] | undefined
        ? ExpansionValue<Exclude<T[K], undefined>[number]> | true
        : ExpansionValue<T[K]> | true;
};
