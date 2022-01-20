import { cloneJson, permutateEntries } from "@entity-space/utils";
import { Observable, Subject } from "rxjs";
import { NamedCriteria } from "../criteria/public";
import { mergeQueries, Query, reduceQueries } from "../query/public";
import { IEntitySchema } from "../schema/schema.interface";
import { createCriteriaTemplateForIndex } from "./create-criteria-template-for-index.fn";
import { Entity } from "./entity";
import { IEntitySource } from "./entity-source.interface";
import { EntityStore } from "./entity-store";
import { expandEntities } from "./expand-entities.fn";
import { flattenNamedCriteria } from "./flatten-named-criteria.fn";
import { namedCriteriaToKeyPaths } from "./named-criteria-to-key-path.fn";
import { normalizeEntities } from "./normalize-entities.fn";
import { QueriedEntities } from "./queried-entities";

// [todo] should implement IEntitySource
export class Workspace {
    private source?: IEntitySource;
    private readonly stores = new Map<string, EntityStore>();
    private readonly sources = new Map<string, IEntitySource>();
    private readonly queryCaches = new Map<string, Query[]>();
    private readonly queryCacheChanged = new Subject<Query[]>();

    onQueryCacheChanged(): Observable<Query[]> {
        return this.queryCacheChanged.asObservable();
    }

    addEntities(schema: IEntitySchema, entities: Entity[]): void {
        entities = cloneJson(entities);
        const normalized = normalizeEntities(schema, entities);

        for (const schema of normalized.getSchemas()) {
            const normalizedEntities = normalized.get(schema);
            this.getOrCreateStore(schema).add(normalizedEntities);
        }
    }

    addEntitySource(schema: IEntitySchema, source: IEntitySource): void {
        this.sources.set(schema.getId(), source);
    }

    private addExecutedQuery(query: Query): void {
        const executedQueries = this.getOrCreateQueryCache(query.entitySchema);
        let merged = mergeQueries(query, ...executedQueries);
        this.queryCaches.set(query.entitySchema.getId(), merged);

        const allQueriesInCache: Query[] = [];

        for (const [_, queries] of this.queryCaches) {
            allQueriesInCache.push(...queries);
        }

        this.queryCacheChanged.next(allQueriesInCache);
    }

    private async loadUncachedIntoCache(query: Query): Promise<void> {
        const executedQueries = this.getOrCreateQueryCache(query.entitySchema);
        const reduced = reduceQueries([query], executedQueries);
        const entities: Entity[] = [];
        const queriesAgainstSource = reduced === false ? [query] : reduced;

        for (const queryAgainstSource of queriesAgainstSource) {
            const result = await this.loadFromSource(queryAgainstSource);

            if (result === false) {
                continue;
            }

            entities.push(...result.getEntities());
            this.addExecutedQuery(query);
        }

        if (entities.length > 0) {
            this.addEntities(query.entitySchema, entities);
        }
    }

    private async loadFromSource(query: Query): Promise<false | QueriedEntities> {
        const source = this.source ?? this.getSource(query.entitySchema);
        const result = await source.query(query);

        if (result !== false) {
            console.log("[effective-query]", result.getQuery().criteria.toString());
        }

        return result;
    }

    // [todo] remove any
    async query(query: Query): Promise<false | Entity[]> {
        await this.loadUncachedIntoCache(query);

        return this.queryAgainstCache(query);
    }

    // [todo] remove any
    // [todo] should stay async because at one point i want to make use of service-workers
    async queryAgainstCache(query: Query): Promise<any[]> {
        const schema = query.entitySchema;
        const indexes = schema
            .getIndexesIncludingKey()
            .slice()
            .sort((a, b) => b.getPath().length - a.getPath().length);

        const criteriaTemplates = indexes.map(index => createCriteriaTemplateForIndex(index));
        const [remappedCriteria] = query.criteria.remap(criteriaTemplates);

        // [todo] remove "any" - but will result in compile error @ 02-loading-data.spec.ts
        let entities: any[] = [];
        const store = this.getOrCreateStore(schema);

        if (remappedCriteria === false) {
            entities = store.getAll();
        } else {
            for (const remappedCriterion of remappedCriteria) {
                // [todo] we probably need to check for duplicates?
                entities.push(...this.readFromStoreUsingIndexCriteria(store, remappedCriterion));
            }
        }

        if (Object.keys(query.expansion).length > 0) {
            entities = cloneJson(entities); // [todo] dirty to do it here?

            const self = this;

            // [todo] hackity-hack. need instead an entity-source that always only goes against cache i guess?
            // that would make workspace class a lot smaller maybe.
            const expansionResult = await expandEntities(schema, query.expansion, entities, {
                async query(q: Query) {
                    const result = await self.queryAgainstCache(q);

                    return new QueriedEntities(q, result);
                },
            });

            console.log("[expansion-result]", expansionResult);
        }

        return query.criteria.filter(entities);
    }

    private readFromStoreUsingIndexCriteria(store: EntityStore, indexCriteria: NamedCriteria): Entity[] {
        const bagKeyPaths = namedCriteriaToKeyPaths(indexCriteria);
        const index = store.getIndexMatchingKeyPaths(bagKeyPaths);
        const bagWithPrimitives = flattenNamedCriteria(indexCriteria);
        const permutatedBags = permutateEntries(bagWithPrimitives);
        const indexValues: (number | string)[][] = [];

        for (const permutatedBag of permutatedBags) {
            const indexValue: (number | string)[] = [];

            for (const key of index.getPath()) {
                indexValue.push(permutatedBag[key]);
            }

            indexValues.push(indexValue);
        }

        return store.getByIndexOrKey(index.getName(), indexValues);
    }

    clearCache(): void {
        this.queryCaches.clear();
        this.stores.clear();
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

    private getSource(schema: IEntitySchema): IEntitySource {
        const source = this.sources.get(schema.getId());

        if (source === void 0) {
            throw new Error(`no source for entity-schema ${schema.getId()} found`);
        }

        return source;
    }

    private getOrCreateQueryCache(schema: IEntitySchema): Query[] {
        let cache = this.queryCaches.get(schema.getId());

        if (cache === void 0) {
            cache = [];
            this.queryCaches.set(schema.getId(), cache);
        }

        return cache;
    }
}
