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

    async query(query: Query): Promise<false | QueriedEntities> {
        const source = this.findSource(query.entitySchema);

        if (source === void 0) {
            return false;
        }

        const result = await source.query(query);

        if (result === false) {
            return false;
        }

        const entities = result.getEntities();
        const effectiveQuery = result.getQuery();
        // [todo] we could add this to the QueriedEntities class, which would then just need the original query as a ctor arg
        const missingExpansion = reduceExpansion(query.expansion, effectiveQuery.expansion) || query.expansion;
        let successfulExpansion = effectiveQuery.expansion;

        if (Object.keys(missingExpansion).length > 0 && entities.length > 0) {
            const result = await expandEntities(query.entitySchema, missingExpansion, entities, this);

            if (result !== false) {
                successfulExpansion = successfulExpansion;
            }
        }

        return new QueriedEntities(
            {
                criteria: effectiveQuery.criteria,
                entitySchema: query.entitySchema,
                expansion: successfulExpansion,
                // [todo] not correct; we somehow need to fish out unresolved expansions from expandEntities() call
                // for now we just assume that all expansions could be resolved within this entity-source
                // expansion: query.expansion,
            },
            entities
        );
    }

    private findSource(schema: IEntitySchema): IEntitySource | undefined {
        return this.sources.get(schema.getId());
    }
}
