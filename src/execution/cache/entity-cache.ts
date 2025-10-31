import {
    copyEntities,
    entitiesToCriterion,
    Entity,
    EntityQuery,
    EntityRelationProperty,
    EntitySchema,
    EntitySelection,
    isHydrated,
    joinEntities,
    matchesCriterion,
    mergeQueries,
    normalizeEntities,
    omitRelationalCriteria,
    omitRelationalSelections,
    subtractQueries,
} from "@entity-space/elements";
import { EntityStore } from "./entity-store";

export class EntityCache {
    readonly #stores = new Map<string, EntityStore>();
    readonly #cachedQueries = new Map<string, EntityQuery[]>();

    query(query: EntityQuery): Entity[] {
        const schema = query.getSchema();
        const selection = query.getSelection();
        const criterion = query.getCriterion();
        const parameters = query.getParameters();
        const storeQuery = this.#toStoreQuery(query);

        let entities = this.#getStore(schema).query(storeQuery);

        if (selection !== undefined) {
            this.#hydrate(entities, schema, selection);
            entities = entities.filter(entity => isHydrated(entity, selection));

            if (criterion) {
                entities = entities.filter(matchesCriterion(criterion));
            }
        }

        if (parameters === undefined) {
            const sorter = schema.getSorter();

            if (sorter) {
                entities.sort(sorter);
            }
        }

        return entities;
    }

    upsert(query: EntityQuery, entities: readonly Entity[]): void {
        const schema = query.getSchema();
        entities = copyEntities(query.getSchema(), entities);
        const normalized = normalizeEntities(schema, entities);

        for (const [schema, entities] of normalized) {
            const store = this.#getStore(schema);
            store.upsert(query, entities);
        }

        const cacheKey = query.getSchema().getName();
        const cachedQueries = this.#cachedQueries.get(cacheKey) ?? [];
        this.#cachedQueries.set(cacheKey, mergeQueries([query, ...cachedQueries]) || [query, ...cachedQueries]);
    }

    subtractByCache(query: EntityQuery): EntityQuery[] | boolean {
        const cachedQueries = this.#cachedQueries.get(query.getSchema().getName()) ?? [];

        if (!cachedQueries.length) {
            return false;
        }

        return subtractQueries([query], cachedQueries);
    }

    #hydrate(entities: Entity[], schema: EntitySchema, selection: EntitySelection): void {
        for (const [name, selectionValue] of Object.entries(selection)) {
            if (!schema.isRelation(name)) {
                continue;
            }

            if (selectionValue === true) {
                throw new Error("invalid selection");
            }

            const relation = schema.getRelation(name);

            if (relation.isEmbedded()) {
                const embeddedEntities = relation.readValues(entities);
                this.#hydrate(embeddedEntities, relation.getRelatedSchema(), selectionValue);
            } else if (relation.isJoined()) {
                this.#hydrateJoin(entities, relation, selectionValue);
            }
        }
    }

    #hydrateJoin(entities: Entity[], relation: EntityRelationProperty, selection: EntitySelection): void {
        const joinCriterion = entitiesToCriterion(entities, relation.getJoinFrom(), relation.getJoinTo());
        const joinQuery = new EntityQuery(relation.getRelatedSchema(), selection, joinCriterion);
        const joinedEntities = this.query(joinQuery);

        joinEntities(entities, joinedEntities, relation);
    }

    #toStoreQuery(query: EntityQuery): EntityQuery {
        const criterion = query.getCriterion();
        const schema = query.getSchema();
        const selection = query.getSelection();
        const storeCriterion = criterion ? omitRelationalCriteria(criterion, schema) : undefined;
        const storeSelection = selection ? omitRelationalSelections(selection, schema) : undefined;
        return query.with({ criterion: storeCriterion, selection: storeSelection });
    }

    #getStore(schema: EntitySchema): EntityStore {
        let store = this.#stores.get(schema.getName());

        if (store === undefined) {
            store = new EntityStore(schema);
            this.#stores.set(schema.getName(), store);
        }

        return store;
    }
}
