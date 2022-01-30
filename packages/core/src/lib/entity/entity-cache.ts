import { NamedCriteria } from "@entity-space/criteria";
import { cloneJson, permutateEntries } from "@entity-space/utils";
import { Query } from "../query/query";
import { IEntitySchema } from "../schema/public";
import { createCriteriaTemplateForIndex } from "./create-criteria-template-for-index.fn";
import { Entity } from "./entity";
import { IEntitySource } from "./entity-source.interface";
import { EntityStore } from "./entity-store";
import { expandEntities } from "./expand-entities.fn";
import { flattenNamedCriteria } from "./flatten-named-criteria.fn";
import { namedCriteriaToKeyPaths } from "./named-criteria-to-key-path.fn";
import { normalizeEntities } from "./normalize-entities.fn";
import { QueriedEntities } from "./queried-entities";

export class EntityCache implements IEntitySource {
    private readonly stores = new Map<string, EntityStore>();

    async query(query: Query): Promise<false | QueriedEntities[]> {
        const schema = query.entitySchema;
        const indexes = schema
            .getIndexesIncludingKey()
            .slice()
            .sort((a, b) => b.getPath().length - a.getPath().length);

        const criteriaTemplates = indexes.map(index => createCriteriaTemplateForIndex(index));
        // [todo] need to properly think about mapping against multiple templates and finding the best one
        const results = criteriaTemplates.map(template => template.remap(query.criteria));
        const firstResult = results.find(result => result !== false);
        // const [remappedCriteria] = query.criteria.remap(criteriaTemplates);

        // [todo] remove "any" - but will result in compile error @ 02-loading-data.spec.ts
        let entities: any[] = [];
        const store = this.getOrCreateStore(schema);

        if (firstResult === void 0 || firstResult === false) {
            entities = store.getAll();
        } else {
            for (const remappedCriterion of firstResult.getCriteria()) {
                // [todo] we probably need to check for duplicates?
                entities.push(...this.readFromStoreUsingIndexCriteria(store, remappedCriterion));
            }
        }

        if (Object.keys(query.expansion).length > 0) {
            entities = cloneJson(entities); // [todo] dirty to do it here?

            const expansionResult = await expandEntities(schema, query.expansion, entities, this);
            console.log("[expansion-result]", expansionResult);
        }

        entities = query.criteria.filter(entities);

        return [new QueriedEntities(query, entities)];
    }

    addEntities(schema: IEntitySchema, entities: Entity[]): void {
        entities = cloneJson(entities);
        const normalized = normalizeEntities(schema, entities);

        for (const schema of normalized.getSchemas()) {
            const normalizedEntities = normalized.get(schema);
            this.getOrCreateStore(schema).add(normalizedEntities);

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

    private getOrCreateStore(schema: IEntitySchema): EntityStore {
        let store = this.stores.get(schema.getId());

        if (store === void 0) {
            store = new EntityStore(schema);
            this.stores.set(schema.getId(), store);
        }

        return store;
    }
}
