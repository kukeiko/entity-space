import { any, anyTemplate, Criterion, NamedCriteriaTemplate, or, orTemplate } from "@entity-space/criteria";
import { cloneJson } from "@entity-space/utils";
import { Query } from "../query/query";
import { IEntitySchema } from "../schema/schema.interface";
import { QueriedEntities } from "./data-structures/queried-entities";
import { Entity } from "./entity";
import { IEntitySource } from "./entity-source.interface";
import { createQueriesFromEntities } from "./functions/create-queries-from-entities.fn";
import { expandEntities } from "./functions/expand-entities.fn";
import { normalizeEntities } from "./functions/normalize-entities.fn";
import { EntityStore } from "./store/entity-store";

export class EntityCache implements IEntitySource {
    private readonly stores = new Map<string, EntityStore>();

    async query(query: Query): Promise<false | QueriedEntities[]> {
        const store = this.getOrCreateStore(query.getEntitySchema());
        const criterion = this.withoutRetlationalCriteria(query.getCriteria(), query.getEntitySchema());
        let entities = store.getByCriterion(criterion);

        if (!query.getExpansion().isEmpty() && entities.length > 0) {
            // [todo] dirty to do it here?
            // [todo] this way of cloning is quite slow.
            entities = cloneJson(entities);
            await expandEntities(query.getEntitySchema(), query.getExpansionObject(), entities, this);
            entities = query.getCriteria().filter(entities);
        }

        return [new QueriedEntities(query, entities)];
    }

    private withoutRetlationalCriteria(criterion: Criterion, schema: IEntitySchema): Criterion {
        const optionalDeepBag: Record<string, any> = {};

        schema.getIndexes().forEach(index => {
            index.getPath().forEach(path => (optionalDeepBag[path] = anyTemplate()));
        });

        const template = orTemplate(NamedCriteriaTemplate.fromDeepBags({}, optionalDeepBag));
        const remapped = template.remap(criterion);

        if (remapped === false) {
            return any();
        }

        return remapped.getCriteria().length === 1 ? remapped.getCriteria()[0] : or(remapped.getCriteria());
    }

    // [todo] not totally happy with this method also creating the queries from the entities,
    // but i wanted to prevent normalizing twice when adding entities, so that is why it is here
    // instead of in the workspace.
    addEntities(schema: IEntitySchema, entities: Entity[]): Query[] {
        entities = cloneJson(entities);
        const normalized = normalizeEntities(schema, entities);
        const createdQueries: Query[] = [];

        for (const schema of normalized.getSchemas()) {
            const normalizedEntities = normalized.get(schema);
            this.getOrCreateStore(schema).add(normalizedEntities);

            // [todo] can not use until we implemented invert() @ named-criteria
            if (normalizedEntities.length > 0) {
                const indexQueries = createQueriesFromEntities(schema, normalizedEntities);

                for (const indexQuery of indexQueries) {
                    createdQueries.push(indexQuery);
                }
            }
        }

        return createdQueries;
    }

    clear(): void {
        this.stores.clear();
    }

    private getOrCreateStore(schema: IEntitySchema): EntityStore {
        let store = this.stores.get(schema.getId());

        if (store === void 0) {
            store = new EntityStore(schema);
            this.stores.set(schema.getId(), store);
        }

        return store;
    }
}
