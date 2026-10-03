import {
    copyEntities,
    Criterion,
    entitiesToCriterion,
    entitiesToQuery,
    Entity,
    EntityPage,
    EntityQuery,
    EntityQueryParameters,
    EntityRelationProperty,
    EntitySchema,
    EntitySelection,
    EntitySort,
    entityToId,
    isHydrated,
    isReadonlyCriterion,
    joinEntities,
    matchesCriterion,
    normalizeEntities,
    omitJoinedCriteria,
    omitJoinedSelections,
    sortEntitiesByDefaultSorter,
} from "@entity-space/elements";
import { ComplexKeyMap } from "@entity-space/utils";
import { map, merge, Observable, Subject } from "rxjs";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntityQueryTracing } from "../entity-query-tracing";
import { EntityQueryCache } from "./entity-query-cache";
import { EntityStore } from "./entity-store";

export class EntityCache {
    constructor(tracing: EntityQueryTracing) {
        this.#tracing = tracing;
    }

    readonly #tracing: EntityQueryTracing;
    readonly #stores = new Map<string, EntityStore>();
    readonly #queryCache = new EntityQueryCache();
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
            entities = entities.filter(entity => isHydrated(schema, selection, entity));

            if (criterion) {
                entities = entities.filter(matchesCriterion(criterion));
            }
        }

        if (parameters === undefined && query.getPage() === undefined) {
            entities = sortEntitiesByDefaultSorter(schema, entities);
        }

        return entities;
    }

    onChanges(schemas: readonly EntitySchema[]): Observable<EntityQueryExecutionContext | undefined> {
        return merge(...schemas.map(schema => this.#getStore(schema).onChange()));
    }

    upsertQuery(query: EntityQuery, entities: readonly Entity[], context?: EntityQueryExecutionContext): void {
        const schema = query.getSchema();
        this.#upsert(
            schema,
            entities,
            query.getSelection(),
            query.getParameters(),
            query.getCriterion(),
            query.getSort(),
            query.getPage(),
            context,
        );
        this.#evictRemovedFromCache(query, entities);
        this.#queryCache.addQuery(query);
        this.#cachedQueriesChanged.next();
    }

    #upsert(
        schema: EntitySchema,
        entities: readonly Entity[],
        selection?: EntitySelection,
        parameters?: EntityQueryParameters,
        criterion?: Criterion,
        sort?: EntitySort,
        page?: EntityPage,
        context?: EntityQueryExecutionContext,
    ): void {
        entities = copyEntities(schema, entities);
        const normalized = normalizeEntities(schema, entities, selection);

        for (const [schema, entities] of normalized) {
            const store = this.#getStore(schema);
            store.upsert(entities, parameters, criterion, sort, page, context);
        }
    }

    delete(query: EntityQuery): void {
        this.#evictRemovedFromCache(query, []);
        this.#queryCache.addQuery(query);
        this.#cachedQueriesChanged.next();
    }

    subtractByCache(query: EntityQuery, maxTimestamp?: string): EntityQuery[] | boolean {
        return this.#queryCache.subtractQuery(query, maxTimestamp);
    }

    getCachedQueries(): readonly EntityQuery[] {
        return this.#queryCache.getQueries();
    }

    getCachedQueries$(): Observable<readonly EntityQuery[]> {
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
        // [todo] ❌ duplicated code from AutoJoinEntityHydrator
        if (relation.getSchema().isUnionSchema()) {
            const concreteSchemas = relation
                .getSchema()
                .getSchemas()
                .filter(schema => schema.hasProperty(relation.getName()));

            entities = entities.filter(entity => {
                return concreteSchemas.some(schema => {
                    const discriminator = schema.getDiscriminator();
                    return discriminator.readValue(entity) === discriminator.getDefaultValue();
                });
            });
        }

        const joinCriterion = entitiesToCriterion(entities, relation.getJoinFrom(), relation.getJoinTo());
        const joinQuery = new EntityQuery(relation.getRelatedSchema(), selection, joinCriterion);
        const joinedEntities = this.query(joinQuery);

        // [todo] ❌ support union schemas (see AutoJoinEntityHydrator)
        joinEntities(entities, joinedEntities, relation);
    }

    #evictRemovedFromCache(query: EntityQuery, next: readonly Entity[]): void {
        const previous = this.query(query);

        if (!previous.length) {
            return;
        }

        const schema = query.getSchema();

        // evict inbound relations
        for (const [key, selected] of Object.entries(query.getSelection())) {
            if (selected === true) {
                continue;
            }

            const relation = schema.getRelation(key);

            // [todo] ❌ should we also check if joined properties are readonly?
            if (!relation.isJoined() || relation.isOutbound()) {
                continue;
            }

            const relatedPrevious = relation.readValuesFlat(previous);

            if (relatedPrevious.length) {
                // 🧪 test this
                const relatedNext = relation.readValuesFlat(next);
                const relatedPreviousQuery = entitiesToQuery(relation.getRelatedSchema(), relatedPrevious, selected);
                this.#evictRemovedFromCache(relatedPreviousQuery, relatedNext);
            }
        }

        const nextMap = new ComplexKeyMap(schema.getIdPaths());

        for (const nextEntity of next) {
            nextMap.set(nextEntity, nextEntity);
        }

        const evicted: Entity[] = [];

        for (const previousEntity of previous) {
            const id = entityToId(schema, previousEntity);

            if (!nextMap.has(id)) {
                evicted.push(previousEntity);
                this.#getStore(schema).remove(id);
            }
        }

        if (!evicted.length) {
            return;
        }

        this.#tracing.entitiesEvictedFromCache(query, evicted);

        const criterion = query.getCriterion();

        if (criterion === undefined || isReadonlyCriterion(query.getSchema(), criterion)) {
            // no need to update cached query state as we assume all removed entities were deleted
            return;
        }

        // [todo] ❌ trace call to log evicted cached queries
        this.#queryCache.evictNonReadonlyQueries(schema);
    }

    #toStoreQuery(query: EntityQuery): EntityQuery {
        const criterion = query.getCriterion();
        const schema = query.getSchema();
        const selection = query.getSelection();
        const storeCriterion = criterion ? omitJoinedCriteria(criterion, schema) : undefined;
        const storeSelection = selection ? omitJoinedSelections(selection, schema) : undefined;

        return query.with({ criterion: storeCriterion ?? null, selection: storeSelection });
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
