import { IEntitySchema } from "@entity-space/common";
import { EntityQuery } from "../../query/query";
import { Entity } from "../entity";

export class EntitySet<T extends Entity = Entity> {
    constructor({ query, entities }: { query: EntityQuery; entities: T[] }) {
        this.query = query;
        this.entities = entities;
    }

    private readonly entities: T[];
    private readonly query: EntityQuery;

    getEntities(): T[] {
        return this.entities.slice();
    }

    getQuery(): EntityQuery {
        return this.query;
    }

    getSchema(): IEntitySchema {
        return this.query.getEntitySchema();
    }

    static empty<T extends Entity = Entity>(query: EntityQuery): EntitySet<T> {
        return new EntitySet({ query, entities: [] });
    }
}
