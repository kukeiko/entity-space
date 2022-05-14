import { cloneJson } from "@entity-space/utils";
import { Query } from "../query/query";
import { IEntitySchema } from "../schema/schema.interface";
import { Entity } from "./entity";
import { IEntitySource } from "./entity-source.interface";
import { EntityStoreV2 } from "./entity-store-v2";
import { EntityType } from "./entity-type";
import { expandEntities } from "./expand-entities.fn";
import { normalizeEntities } from "./normalize-entities.fn";
import { QueriedEntities } from "./queried-entities";

export class EntityCacheV2 implements IEntitySource {
    private readonly stores = new Map<string, EntityStoreV2>();

    async query(query: Query): Promise<false | QueriedEntities[]> {
        const store = this.getOrCreateStore(query.getEntitySchema());
        let entities = store.getByCriterion(query.getCriteria());

        if (!query.getExpansion().isEmpty() && entities.length > 0) {
            // [todo] dirty to do it here?
            // [todo] this way of cloning is quite slow.
            entities = cloneJson(entities);

            const expansionResult = await expandEntities(
                query.getEntitySchema(),
                query.getExpansionObject(),
                entities,
                this
            );

            console.log("[expansion-result]", expansionResult);
        }

        return [new QueriedEntities(query, entities)];
    }

    
    addEntities(schema: IEntitySchema, entities: Entity[]): void {
        entities = cloneJson(entities);
        const normalized = normalizeEntities(schema, entities);

        for (const schema of normalized.getSchemas()) {
            const normalizedEntities = normalized.get(schema);
            this.getOrCreateStore(schema).upsert(normalizedEntities);

            //     // [todo] can not use until we implemented invert() @ named-criteria
            //     // if (normalizedEntities.length > 0) {
            //     //     const indexQueries = createQueriesFromEntities(schema, normalizedEntities);

            //     //     for (const indexQuery of indexQueries) {
            //     //         this.addExecutedQuery(indexQuery);
            //     //     }
            //     // }
        }
    }

    clear(): void {
        this.stores.clear();
    }

    private getOrCreateStore(schema: IEntitySchema): EntityStoreV2 {
        let store = this.stores.get(schema.getId());

        if (store === void 0) {
            const entityType = new EntityType(schema);
            store = new EntityStoreV2(entityType);
            this.stores.set(schema.getId(), store);
        }

        return store;
    }
}
