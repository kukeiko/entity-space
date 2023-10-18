import { Entity } from "../common/entity.type";
import { IEntitySchema } from "../schema/schema.interface";
import { IEntityQuery } from "../query/entity-query.interface";

export class EntitySet<T extends Entity = Entity> {
    constructor({ query, entities }: { query: IEntityQuery; entities: T[] }) {
        this.query = query;
        this.entities = entities;
    }

    private readonly entities: T[];
    private readonly query: IEntityQuery;

    getEntities(): T[] {
        return this.entities.slice();
    }

    getQuery(): IEntityQuery {
        return this.query;
    }

    getSchema(): IEntitySchema {
        return this.query.getEntitySchema();
    }

    static empty<T extends Entity = Entity>(query: IEntityQuery): EntitySet<T> {
        return new EntitySet({ query, entities: [] });
    }
}
