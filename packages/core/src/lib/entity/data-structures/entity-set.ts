import { Query } from "../../query/query";
import { Entity } from "../entity";

export class EntitySet<T extends Entity = Entity> {
    constructor({ query, entities }: { query: Query; entities: T[] }) {
        this.query = query;
        this.entities = entities;
    }

    private readonly entities: T[];
    private readonly query: Query;

    getEntities(): T[] {
        return this.entities.slice();
    }

    getQuery(): Query {
        return this.query;
    }

    static empty<T extends Entity = Entity>(query: Query): EntitySet<T> {
        return new EntitySet({ query, entities: [] });
    }
}
