import { Query } from "./query";
import { QueriedEntitySet } from "./queried-entity-set";

/**
 * This represents an instruction on how to hydrate a particular property of an entity.
 *
 * It contains the query that needs to be executed to load the data required for hyration,
 * and a method to assign the hydration data.
 */
export interface InstrumentedHydration<T, U = any> {
    query: Query<U>;
    assign(entities: QueriedEntitySet<T>, queried: QueriedEntitySet<U>): QueriedEntitySet<T>;
}
