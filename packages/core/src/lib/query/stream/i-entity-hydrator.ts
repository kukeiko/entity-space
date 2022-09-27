import { Entity, EntityHydrationQuery } from "../../entity";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { QueryStream } from "./query-stream";

export interface IEntityHydrator {
    hydrate$<T extends Entity>(
        hydrationQuery: EntityHydrationQuery<T>,
        database: InMemoryEntityDatabase
    ): QueryStream<T>;
}
