import { reduceExpansion } from "../expansion/public";
import { Query } from "../query/query";
import { IEntitySchema } from "../schema/public";
import { IEntitySource } from "./entity-source.interface";
import { expandEntities } from "./expand-entities.fn";
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
            const entities = queried.getEntities();
            const effectiveQuery = queried.getQuery();

            // [todo] we could add this to the QueriedEntities class, which would then just need the original query as a ctor arg
            const missingExpansion =
                reduceExpansion(query.getExpansion(), effectiveQuery.getExpansion()) || query.getExpansion();
            let successfulExpansion = effectiveQuery.getExpansion();

            if (Object.keys(missingExpansion).length > 0 && entities.length > 0) {
                const result = await expandEntities(query.getEntitySchema(), missingExpansion, entities, this);

                if (result !== false) {
                    successfulExpansion = successfulExpansion;
                }
            }

            results.push(
                new QueriedEntities(
                    // [todo] not correct; we somehow need to fish out unresolved expansions from expandEntities() call
                    // for now we just assume that all expansions could be resolved within this entity-source
                    // expansion: query.expansion,
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
