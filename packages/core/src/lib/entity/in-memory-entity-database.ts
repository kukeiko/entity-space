import { IEntitySchema, IEntitySchemaRelation, UnpackedEntitySelection } from "@entity-space/common";
import {
    any,
    AnyCriterion,
    anyShape,
    Criterion,
    NamedCriteriaShape,
    never,
    NeverCriterion,
    or,
    orShape,
} from "@entity-space/criteria";
import { cloneJson, groupBy, isDefined, readPath } from "@entity-space/utils";
import { flatten } from "lodash";
import { Observable, Subject } from "rxjs";
import { EntityQuery } from "../query/entity-query";
import { EntitySelection } from "../query/entity-selection";
import { mergeQueries } from "../query/merge-queries.fn";
import { QueryPaging } from "../query/query-paging";
import { subtractQueries } from "../query/subtract-queries.fn";
import { EntitySet } from "./data-structures/entity-set";
import { Entity } from "./entity";
import { createCriterionFromEntities } from "./functions/create-criterion-from-entities.fn";
import { createQueriesFromEntities } from "./functions/create-queries-from-entities.fn";
import { joinEntities } from "./functions/join-entities.fn";
import { normalizeEntities } from "./functions/normalize-entities.fn";
import { IEntityDatabase } from "./i-entity-database";
import { EntityStore } from "./store/entity-store";
import { PagedEntityIdCache } from "./store/paged-entity-id-cache";

export class InMemoryEntityDatabase implements IEntityDatabase {
    private readonly stores = new Map<string, EntityStore>();
    private readonly cachedQueries = new Map<string, EntityQuery[]>();
    private readonly queryCacheChanged = new Subject<EntityQuery[]>();
    private readonly optionsCache: { options?: Criterion; paging?: QueryPaging; ids: Criterion }[] = [];
    // private

    private readonly noOptionsPageCache: { criteria: Criterion; cache: PagedEntityIdCache }[] = [];
    private readonly optionsCache_v2: { options: Criterion; criteria: Criterion; ids: Entity[] }[] = [];
    private readonly optionsPageCache: { options: Criterion; criteria: Criterion; cache: PagedEntityIdCache }[] = [];

    queryCacheChanged$(): Observable<EntityQuery[]> {
        return this.queryCacheChanged.asObservable();
    }

    async query(query: EntityQuery): Promise<EntitySet> {
        return this.querySync(query);
    }

    reduceByCached(query: EntityQuery): EntityQuery[] | false {
        const cached = this.getCachedQueries(query.getEntitySchema());
        return subtractQueries([query], cached);
    }

    // [todo] not used; but i did not want to delete it already.
    // if i don't find a use soonish™, i should remove it
    reduceManyByCached(queries: EntityQuery[]): EntityQuery[] {
        const groupedBySchema = groupBy(queries, query => query.getEntitySchema());

        const reduced: EntityQuery[] = [];

        for (const [schema, queries] of groupedBySchema.entries()) {
            const result = subtractQueries(queries, this.getCachedQueries(schema));

            if (!result) {
                reduced.push(...queries);
                continue;
            }

            reduced.push(...result);
        }

        return reduced;
    }

    // [todo] need some tests
    querySync<T extends Entity = Entity>(query: EntityQuery): EntitySet<T> {
        const store = this.getOrCreateStore(query.getEntitySchema());
        const criterion = this.withoutRetlationalCriteria(query.getCriteria(), query.getEntitySchema());
        let entities = store.getByCriterion(criterion) as T[];

        const options = query.getOptions();
        const page = query.getPaging();
        const criteria = query.getCriteria();

        if (!(options instanceof NeverCriterion) && !(options instanceof AnyCriterion)) {
            if (page) {
                const match = this.optionsPageCache.find(
                    item => item.options.equivalent(options) && item.criteria.equivalent(criteria)
                );

                if (!match) {
                    return new EntitySet<T>({ query, entities: [] });
                } else {
                    entities = match.cache
                        .get(page)
                        .filter(isDefined)
                        .map(id => store.get(id))
                        .filter(isDefined) as T[];
                }
            } else {
                const match = this.optionsCache_v2.find(
                    item => item.options.equivalent(options) && item.criteria.equivalent(criteria)
                );

                if (!match) {
                    return new EntitySet<T>({ query, entities: [] });
                } else {
                    entities = match.ids.map(id => store.get(id)).filter(isDefined) as T[];
                }
            }
        } else if (page) {
            const match = this.noOptionsPageCache.find(item => item.criteria.equivalent(criteria));

            if (!match) {
                return new EntitySet<T>({ query, entities: [] });
            } else {
                entities = match.cache
                    .get(page)
                    .filter(isDefined)
                    .map(id => store.get(id))
                    .filter(isDefined) as T[];
            }
        }

        if (!query.getSelection().isEmpty() && entities.length > 0) {
            // [todo] dirty to do it here?
            // [todo] this way of cloning is quite slow.
            entities = cloneJson(entities);
            this.hydrateEntities(query.getEntitySchema(), query.getSelection(), entities);
            entities = query.getCriteria().filter(entities);
        }

        if (criterion instanceof AnyCriterion && !(query.getCriteria() instanceof AnyCriterion)) {
            // [todo] hotfix for non-related, but nested criteria
            entities = query.getCriteria().filter(entities);
        }

        return new EntitySet<T>({ query, entities });
    }

    // [todo] i think introduction of this broke workspace playground tests
    private withoutRetlationalCriteria(criterion: Criterion, schema: IEntitySchema): Criterion {
        const optionalDeepBag: Record<string, any> = {};

        schema.getIndexes().forEach(index => {
            index.getPath().forEach(path => (optionalDeepBag[path] = anyShape()));
        });

        const template = orShape(NamedCriteriaShape.fromRequiredAndOptionalDeepBags({}, optionalDeepBag));
        const remapped = template.reshape(criterion);

        if (remapped === false) {
            return any();
        }

        return remapped.getReshaped().length === 1 ? remapped.getReshaped()[0] : or(remapped.getReshaped());
    }

    upsertSync(entitySet: EntitySet<Entity>): void {
        this.addQueryToCached(entitySet.getQuery());
        const entities = cloneJson(entitySet.getEntities());
        const normalized = normalizeEntities(entitySet.getQuery().getEntitySchema(), entities);
        const options = entitySet.getQuery().getOptions();
        const page = entitySet.getQuery().getPaging();
        const criteria = entitySet.getQuery().getCriteria();

        if (!(options instanceof NeverCriterion) && !(options instanceof AnyCriterion) && page) {
            const match = this.optionsPageCache.find(
                item => item.options.equivalent(options) && item.criteria.equivalent(criteria)
            );

            if (match) {
                match.cache.add(entities, page);
            } else {
                const cache = new PagedEntityIdCache();
                cache.add(entities, page);
                this.optionsPageCache.push({ options, cache, criteria });
            }
        } else if (!(options instanceof NeverCriterion) && !(options instanceof AnyCriterion)) {
            const match = this.optionsCache_v2.find(
                item => item.options.equivalent(options) && item.criteria.equivalent(criteria)
            );

            if (match) {
                match.ids = entities;
            } else {
                this.optionsCache_v2.push({ ids: entities, options, criteria });
            }
        } else if (page) {
            const match = this.noOptionsPageCache.find(item => item.criteria.equivalent(criteria));

            if (match) {
                match.cache.add(entities, page);
            } else {
                const cache = new PagedEntityIdCache();
                cache.add(entities, page);
                this.noOptionsPageCache.push({ cache, criteria });
            }
        }

        if (!(options instanceof NeverCriterion) && !(options instanceof AnyCriterion)) {
            if (entitySet.getEntities().length) {
                const key = entitySet.getSchema().getKey();
                const keyCriterion = createCriterionFromEntities(entitySet.getEntities(), key.getPath());
                this.optionsCache.push({ options, paging: page, ids: keyCriterion });
            } else {
                this.optionsCache.push({ options, paging: page, ids: never() });
            }
        } else if (page) {
            if (entitySet.getEntities().length) {
                const key = entitySet.getSchema().getKey();
                const keyCriterion = createCriterionFromEntities(entitySet.getEntities(), key.getPath());
                this.optionsCache.push({ paging: page, ids: keyCriterion });
            } else {
                this.optionsCache.push({ paging: page, ids: never() });
            }
        }

        for (const schema of normalized.getSchemas()) {
            const normalizedEntities = normalized.get(schema);
            this.getOrCreateStore(schema).add(normalizedEntities);

            if (normalizedEntities.length > 0) {
                const indexQueries = createQueriesFromEntities(schema, normalizedEntities);

                for (const indexQuery of indexQueries) {
                    this.addQueryToCached(indexQuery);
                }
            }
        }
    }

    async upsert(entitySet: EntitySet<Entity>): Promise<void> {
        this.upsertSync(entitySet);
    }

    clear(): void {
        this.stores.clear();
        this.cachedQueries.clear();
        this.queryCacheChanged.next([]);
    }

    private getOrCreateStore(schema: IEntitySchema): EntityStore {
        let store = this.stores.get(schema.getId());

        if (store === void 0) {
            store = new EntityStore(schema);
            this.stores.set(schema.getId(), store);
        }

        return store;
    }

    private hydrateEntities(schema: IEntitySchema, selection: EntitySelection, entities: Entity[]): void {
        // [todo] dirty
        const isHydrated = (propertyKey: string): boolean => {
            const first = entities[0];

            if (first === void 0) return false;

            return first[propertyKey] !== void 0;
        };

        let selectionValue = selection.getValue();

        for (const propertyKey in selectionValue) {
            const selectionValueProperty = selectionValue[propertyKey];

            if (selectionValueProperty === void 0) {
                continue;
            }

            const relation = schema.findRelation(propertyKey);

            if (relation !== void 0 && !isHydrated(relation.getPropertyName())) {
                this.hydrateRelation(
                    entities,
                    relation,
                    selectionValueProperty === true ? void 0 : selectionValueProperty
                );
            } else if (selectionValueProperty !== true) {
                const property = schema.getProperty(propertyKey);
                const referencedItems: Entity[] = [];

                for (const entity of entities) {
                    const reference = readPath<Entity>(propertyKey, entity);

                    if (Array.isArray(reference)) {
                        referencedItems.push(...reference);
                    } else if (reference) {
                        referencedItems.push(reference);
                    }
                }

                const entitySchema = property.getUnboxedEntitySchema();
                this.hydrateEntities(
                    entitySchema,
                    new EntitySelection({ schema: entitySchema, value: selectionValueProperty }),
                    referencedItems
                );
            }
        }
    }

    private hydrateRelation(
        entities: Entity[],
        relation: IEntitySchemaRelation,
        selection?: UnpackedEntitySelection
    ): void {
        const relatedSchema = relation.getRelatedEntitySchema();
        // [todo] what about dictionaries?
        const isArray = relation.getProperty().getValueSchema().schemaType === "array";
        const fromIndex = relation.getFromIndex();
        const toIndex = relation.getToIndex();
        const criteria = createCriterionFromEntities(entities, fromIndex.getPath(), toIndex.getPath());
        const query = new EntityQuery({
            entitySchema: relatedSchema,
            criteria,
            selection: selection ?? relatedSchema.getDefaultSelection(),
        });

        const result = this.querySync(query);

        joinEntities(
            entities,
            result.getEntities(),
            relation.getPropertyName(),
            fromIndex.getPath(),
            toIndex.getPath(),
            isArray
        );
    }

    addQueryToCached(query: EntityQuery): void {
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        this.cachedQueries.set(query.getEntitySchema().getId(), mergeQueries(query, ...cachedQueries));
        this.queryCacheChanged.next(flatten(Array.from(this.cachedQueries.values())));
    }

    getCachedQueries(schema: IEntitySchema): EntityQuery[] {
        return this.cachedQueries.get(schema.getId()) ?? [];
    }
}
