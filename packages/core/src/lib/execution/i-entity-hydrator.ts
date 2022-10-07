import { Entity } from "../entity/entity";
import { IEntityDatabase } from "../entity/i-entity-database";
import { EntityHydrationQuery } from "./entity-hydration-query";
import { QueryStream } from "./query-stream";

export interface IEntityHydrator {
    hydrate$<T extends Entity>(hydrationQuery: EntityHydrationQuery<T>, database: IEntityDatabase): QueryStream<T>;
}
