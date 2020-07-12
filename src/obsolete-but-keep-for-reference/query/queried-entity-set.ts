import { EntitySet } from "./entity-set";
import { Query } from "./query";

export class QueriedEntitySet<T = any> extends EntitySet<T> {
    constructor(query: Query<T>, entities: T[]) {
        super(query.entityType, entities);

        this.query = query;
    }

    readonly query: Query<T>;
}
