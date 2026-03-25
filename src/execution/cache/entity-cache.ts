import {
    copyEntities,
    entitiesToCriterion,
    Entity,
    EntityQuery,
    EntityQueryParameters,
    EntityRelationProperty,
    EntitySchema,
    EntitySelection,
    entityToId,
    isHydrated,
    isReadonlyCriterion,
    joinEntities,
    matchesCriterion,
    mergeQueries,
    normalizeEntities,
    omitRelationalCriteria,
    omitRelationalSelections,
    subtractQueries,
} from "@entity-space/elements";
import { ComplexKeyMap } from "@entity-space/utils";
import { map, merge, Observable, Subject } from "rxjs";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntityStore } from "./entity-store";

export class EntityCache {
    readonly #stores = new Map<string, EntityStore>();
    readonly #cachedQueries = new Map<string, EntityQuery[]>();
    readonly #cachedQueriesChanged = new Subject<void>();

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

    onChanges(schemas: readonly EntitySchema[]): Observable<EntityQueryExecutionContext | undefined> {
        return merge(...schemas.map(schema => this.#getStore(schema).onChange()));
    }

    upsertQuery(query: EntityQuery, entities: readonly Entity[], context?: EntityQueryExecutionContext): void {
        const schema = query.getSchema();
        this.upsert(schema, entities, query.getParameters(), context);
        this.#evictRemovedFromCache(query, entities);
        const cacheKey = query.getSchema().getName();
        const cachedQueries = this.#cachedQueries.get(cacheKey) ?? [];
        this.#cachedQueries.set(cacheKey, mergeQueries([query, ...cachedQueries]) || [query, ...cachedQueries]);
        this.#cachedQueriesChanged.next();
    }

    upsert(
        schema: EntitySchema,
        entities: readonly Entity[],
        parameters?: EntityQueryParameters,
        context?: EntityQueryExecutionContext,
    ): void {
        entities = copyEntities(schema, entities);
        const normalized = normalizeEntities(schema, entities);

        for (const [schema, entities] of normalized) {
            const store = this.#getStore(schema);
            store.upsert(entities, parameters, context);
        }
    }

    subtractByCache(query: EntityQuery): EntityQuery[] | boolean {
        const cachedQueries = this.#cachedQueries.get(query.getSchema().getName()) ?? [];

        if (!cachedQueries.length) {
            return false;
        }

        return subtractQueries([query], cachedQueries);
    }

    getCachedQueries(): EntityQuery[] {
        return Array.from(this.#cachedQueries.values()).flat();
    }

    getCachedQueries$(): Observable<EntityQuery[]> {
        return this.#cachedQueriesChanged.pipe(map(() => this.getCachedQueries()));
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
                const embeddedEntities = relation.readValuesFlat(entities);
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

    // [todo] ❌ implement evicting inbound relations w/ readonly join properties
    #evictRemovedFromCache(query: EntityQuery, next: readonly Entity[]): void {
        const previous = this.query(query);

        if (!previous.length) {
            return;
        }

        const schema = query.getSchema();
        const nextMap = new ComplexKeyMap(schema.getIdPaths());

        for (const nextEntity of next) {
            nextMap.set(nextEntity, nextEntity);
        }

        const evicted: Entity[] = [];

        for (const previousEntity of previous) {
            const id = entityToId(schema, previousEntity);

            if (!nextMap.has(id)) {
                // [todo] ❌ collect all evicted and use 1x tracing call instead
                console.log("🚯 evict from cache", schema.getName(), JSON.stringify(id));
                evicted.push(previousEntity);
                this.#getStore(schema).remove(id);
            }
        }

        if (!evicted.length) {
            return;
        }

        const criterion = query.getCriterion();

        if (criterion === undefined || isReadonlyCriterion(query.getSchema(), criterion)) {
            // no need to update cached query state as we assume all removed entities were deleted
            return;
        }

        // [todo] ❌ trace call to log evicted cached queries
        const cachedQueries = (this.#cachedQueries.get(schema.getName()) ?? []).filter(cachedQuery => {
            const criterion = cachedQuery.getCriterion();

            if (criterion === undefined) {
                return true;
            }

            return isReadonlyCriterion(cachedQuery.getSchema(), criterion);
        });

        this.#cachedQueries.set(schema.getName(), cachedQueries);
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
