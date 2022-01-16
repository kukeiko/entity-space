import { cloneJson, permutateEntries } from "@entity-space/utils";
import { Observable, Subject } from "rxjs";
import { Expansion } from "../expansion/public";
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

export class Workspace {
    private readonly stores = new Map<string, EntityStore>();
    private readonly sources = new Map<string, IEntitySource>();
    private readonly queryCaches = new Map<string, Query[]>();

    private readonly queryCacheChanged = new Subject<Query[]>();

    onQueryCacheChanged(): Observable<Query[]> {
        return this.queryCacheChanged.asObservable();
    }

    addEntities(schema: IEntitySchema, entities: Entity[]): void {
        const normalized = normalizeEntities(schema, entities);

        for (const schema of normalized.getSchemas()) {
            this.getOrCreateStore(schema).add(normalized.get(schema));
        }
    }

    addEntitySource(schema: IEntitySchema, source: IEntitySource): void {
        this.sources.set(schema.getId(), source);
    }

    private addExecutedQuery(query: Query): void {
        const executedQueries = this.getOrCreateQueryCache(query.entitySchema);
        let merged = mergeQueries(...executedQueries, query);
        // [todo] hacky workaround
        merged = mergeQueries(...merged);
        this.queryCaches.set(query.entitySchema.getId(), merged);
        this.queryCacheChanged.next(merged);
    }

    private async loadUncachedIntoCache(query: Query): Promise<void> {
        const executedQueries = this.getOrCreateQueryCache(query.entitySchema);
        const reduced = reduceQueries([query], executedQueries);
        const entitiesLoadedFromSource: Entity[] = [];

        if (reduced === false) {
            entitiesLoadedFromSource.push(...(await this.loadFromSource(query)));
            this.addExecutedQuery(query);
            // executedQueries.push(query);
        } else {
            for (const reducedQuery of reduced) {
                entitiesLoadedFromSource.push(...(await this.loadFromSource(reducedQuery)));
                this.addExecutedQuery(query);
                // executedQueries.push(reducedQuery);
            }
        }

        if (entitiesLoadedFromSource.length > 0) {
            this.addEntities(query.entitySchema, entitiesLoadedFromSource);
        }
    }

    private async loadFromSource(query: Query): Promise<Entity[]> {
        const source = this.getSource(query.entitySchema);
        const entities = await source.query(query);

        return entities;
    }

    // [todo] remove any
    async query(query: Query): Promise<any[]> {
        await this.loadUncachedIntoCache(query);

        return this.queryAgainstCache(query);
    }

    // [todo] remove any
    // [todo] should stay async because at one point i want to make use of service-workers
    async queryAgainstCache(query: Query): Promise<any[]> {
        // await this.loadUncachedIntoStores(query);

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
            // load items from store using index
            for (const remappedCriterion of remappedCriteria) {
                const bagKeyPaths = namedCriteriaToKeyPaths(remappedCriterion);
                const index = store.getIndexMatchingKeyPaths(bagKeyPaths);
                const bagWithPrimitives = flattenNamedCriteria(remappedCriterion);
                const permutatedBags = permutateEntries(bagWithPrimitives);
                const indexValues: (number | string)[][] = [];

                for (const permutatedBag of permutatedBags) {
                    const indexValue: (number | string)[] = [];

                    for (const key of index.getPath()) {
                        indexValue.push(permutatedBag[key]);
                    }

                    indexValues.push(indexValue);
                }

                entities = [...entities, ...store.getByIndexOrKey(index.getName(), indexValues)];
            }
        }

        if (Object.keys(query.expansion).length > 0) {
            entities = cloneJson(entities); // [todo] dirty to do it here
            this.expand(schema, query.expansion, entities);
        }

        return query.criteria.filter(entities);
    }

    expand(schema: IEntitySchema, expansion: Expansion, entities: Entity[]): void {
        for (const propertyKey in expansion) {
            const expansionValue = expansion[propertyKey];

            if (expansionValue === void 0) {
                continue;
            }

            const relation = schema.findRelation(propertyKey);

            if (relation !== void 0) {
                expandEntities(
                    entities,
                    relation,
                    q => this.queryAgainstCache(q),
                    expansionValue === true ? void 0 : expansionValue
                );
            } else if (expansionValue !== true) {
                const property = schema.getProperty(propertyKey);
                const referencedItems: Entity[] = [];

                for (const entity of entities) {
                    const reference = entity[propertyKey];

                    if (Array.isArray(reference)) {
                        referencedItems.push(...reference);
                    } else {
                        referencedItems.push(reference);
                    }
                }

                const entitySchema = property.getUnboxedEntitySchema();
                this.expand(entitySchema, expansionValue, referencedItems);
            }
        }
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
