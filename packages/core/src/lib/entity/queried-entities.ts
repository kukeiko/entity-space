import { Query } from "../query/public";
import { Entity } from "./entity";

export class QueriedEntities {
    constructor(query: Query, entities: Entity[]) {
        this.query = query;
        this.entities = entities;
    }

    private readonly entities: Entity[];
    private readonly query: Query;

    getEntities(): Entity[] {
        return this.entities.slice();
    }

    getQuery(): Query {
        return this.query;
    }
}
