import { ExpansionValue, IEntitySchema, IEntitySchemaRelation } from "@entity-space/common";
import {
    any,
    AnyCriterion,
    anyTemplate,
    Criterion,
    NamedCriteriaTemplate,
    never,
    NeverCriterion,
    or,
    orTemplate,
} from "@entity-space/criteria";
import { cloneJson, groupBy, isDefined, readPath } from "@entity-space/utils";
import { flatten } from "lodash";
import { Observable, Subject } from "rxjs";
import { Expansion } from "../expansion/expansion";
import { mergeQueries } from "../query/merge-queries.fn";
import { Query } from "../query/query";
import { QueryPaging } from "../query/query-paging";
import { reduceQueries } from "../query/reduce-queries.fn";
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
    private readonly cachedQueries = new Map<string, Query[]>();
    private readonly queryCacheChanged = new Subject<Query[]>();
    private readonly optionsCache: { options?: Criterion; paging?: QueryPaging; ids: Criterion }[] = [];
    // private

    private readonly noOptionsPageCache: { criteria: Criterion; cache: PagedEntityIdCache }[] = [];
    private readonly optionsCache_v2: { options: Criterion; criteria: Criterion; ids: Entity[] }[] = [];
    private readonly optionsPageCache: { options: Criterion; criteria: Criterion; cache: PagedEntityIdCache }[] = [];

    queryCacheChanged$(): Observable<Query[]> {
        return this.queryCacheChanged.asObservable();
    }

    async query(query: Query): Promise<EntitySet> {
        return this.querySync(query);
    }

    reduceByCached(query: Query): Query[] | false {
        const cached = this.getCachedQueries(query.getEntitySchema());
        return reduceQueries([query], cached);
    }

    // [todo] not used; but i did not want to delete it already.
    // if i don't find a use soonish™, i should remove it
    reduceManyByCached(queries: Query[]): Query[] {
        const groupedBySchema = groupBy(queries, query => query.getEntitySchema());

        const reduced: Query[] = [];

        for (const [schema, queries] of groupedBySchema.entries()) {
            const result = reduceQueries(queries, this.getCachedQueries(schema));

            if (!result) {
                reduced.push(...queries);
                continue;
            }

            reduced.push(...result);
        }

        return reduced;
    }

    // [todo] need some tests
    querySync<T extends Entity = Entity>(query: Query): EntitySet<T> {
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

        if (!query.getExpansion().isEmpty() && entities.length > 0) {
            // [todo] dirty to do it here?
            // [todo] this way of cloning is quite slow.
            entities = cloneJson(entities);
            this.expandEntities(query.getEntitySchema(), query.getExpansion(), entities);
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
            index.getPath().forEach(path => (optionalDeepBag[path] = anyTemplate()));
        });

        const template = orTemplate(NamedCriteriaTemplate.fromRequiredAndOptionalDeepBags({}, optionalDeepBag));
        const remapped = template.remap(criterion);

        if (remapped === false) {
            return any();
        }

        return remapped.getCriteria().length === 1 ? remapped.getCriteria()[0] : or(remapped.getCriteria());
    }

    async upsert(entitySet: EntitySet<Entity>): Promise<void> {
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

    private expandEntities(schema: IEntitySchema, expansion: Expansion, entities: Entity[]): void {
        // [todo] dirty
        const isExpanded = (propertyKey: string): boolean => {
            const first = entities[0];

            if (first === void 0) return false;

            return first[propertyKey] !== void 0;
        };

        let expansionObject = expansion.getValue();

        if (expansionObject === true) {
            expansionObject = schema.getDefaultExpansion();
        }

        for (const propertyKey in expansionObject) {
            const expansionValue = expansionObject[propertyKey];

            if (expansionValue === void 0) {
                continue;
            }

            const relation = schema.findRelation(propertyKey);

            if (relation !== void 0 && !isExpanded(relation.getPropertyName())) {
                this.expandRelation(entities, relation, expansionValue === true ? void 0 : expansionValue);
            } else if (expansionValue !== true) {
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
                this.expandEntities(
                    entitySchema,
                    new Expansion({ schema: entitySchema, value: expansionValue }),
                    referencedItems
                );
            }
        }
    }

    private expandRelation(entities: Entity[], relation: IEntitySchemaRelation, expansion?: ExpansionValue): void {
        const relatedSchema = relation.getRelatedEntitySchema();
        // [todo] what about dictionaries?
        const isArray = relation.getProperty().getValueSchema().schemaType === "array";
        const fromIndex = relation.getFromIndex();
        const toIndex = relation.getToIndex();
        const criteria = createCriterionFromEntities(entities, fromIndex.getPath(), toIndex.getPath());
        const query = new Query({
            entitySchema: relatedSchema,
            criteria,
            expansion: expansion ?? relatedSchema.getDefaultExpansion(),
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

    addQueryToCached(query: Query): void {
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        this.cachedQueries.set(query.getEntitySchema().getId(), mergeQueries(query, ...cachedQueries));
        this.queryCacheChanged.next(flatten(Array.from(this.cachedQueries.values())));
    }

    getCachedQueries(schema: IEntitySchema): Query[] {
        return this.cachedQueries.get(schema.getId()) ?? [];
    }
}
