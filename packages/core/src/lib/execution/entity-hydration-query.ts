import { Query } from "../query/query";
import { Entity } from "../entity/entity";
import { EntitySet } from "../entity/data-structures/entity-set";

export class EntityHydrationQuery<T = Entity> {
    constructor({ entitySet, query }: { entitySet: EntitySet<T>; query: Query }) {
        this.entitySet = entitySet;
        this.query = query;
    }

    private readonly entitySet: EntitySet<T>;
    private readonly query: Query;

    getEntitySet(): EntitySet<T> {
        return this.entitySet;
    }

    getQuery(): Query {
        return this.query;
    }
}