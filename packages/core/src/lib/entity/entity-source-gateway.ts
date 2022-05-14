import { Query } from "../query/query";
import { IEntitySchema } from "../schema/public";
import { IEntitySource } from "./entity-source.interface";
import { expandEntities } from "./functions/expand-entities.fn";
import { QueriedEntities } from "./queried-entities";

export class EntitySourceGateway implements IEntitySource {
    private readonly sources = new Map<string, IEntitySource>();

    addSource(schema: IEntitySchema, source: IEntitySource): void {
        this.sources.set(schema.getId(), source);
    }

    async query(query: Query): Promise<false | QueriedEntities[]> {
        const source = this.findSource(query.getEntitySchema());

        if (source === void 0) {
            return false;
        }

        const result = await source.query(query);

        if (result === false) {
            return false;
        }

        const results: QueriedEntities[] = [];

        for (const queried of result) {
            const effectiveQuery = queried.getQuery();
            const openExpansion = effectiveQuery.getExpansion().reduce_alt(query.getExpansion());
            let successfulExpansion = effectiveQuery.getExpansionObject();
            const entities = queried.getEntities();

            if (entities.length > 0 && !openExpansion.isEmpty()) {
                const result = await expandEntities(query.getEntitySchema(), openExpansion.getObject(), entities, this);

                if (result !== false) {
                    successfulExpansion = result;
                }
            }

            results.push(
                new QueriedEntities(
                    new Query(query.getEntitySchema(), effectiveQuery.getCriteria(), successfulExpansion),
                    entities
                )
            );
        }

        return results;
    }

    private findSource(schema: IEntitySchema): IEntitySource | undefined {
        return this.sources.get(schema.getId());
    }
}
