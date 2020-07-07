import { Class, Fields } from "./lang";
import { EntityTypeMetadata } from "./metadata";

export interface EntityClass<T> {
    getMetadata(): EntityTypeMetadata<T>;
}

// export abstract class Entity<T, U extends EntityClass<T>> {
export abstract class Entity<T = any, U extends EntityClass<T> = any> {
    constructor(args?: Entity.CtorArgs<T>) {
        Object.assign(this, args || {});
    }

    _foo(): U {
        return {} as any;
    }
}

export module Entity {
    export type CtorArgs<T> = Partial<Pick<T, Fields<T>>>;
}
