import { Query } from "../../query/public";
import { Entity } from "../entity";

export class QueriedEntities<T extends Entity = Entity> {
    constructor(query: Query, entities: T[]) {
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
}
