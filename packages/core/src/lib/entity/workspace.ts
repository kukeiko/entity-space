import { permutateEntries } from "@entity-space/utils";
import { Expansion } from "../expansion/public";
import { Query } from "../query/public";
import { IEntitySchema } from "../schema/schema.interface";
import { createCriteriaTemplateForIndex } from "./create-criteria-template-for-index.fn";
import { Entity } from "./entity";
import { EntityStore } from "./entity-store";
import { expandEntities } from "./expand-entities.fn";
import { flattenNamedCriteria } from "./flatten-named-criteria.fn";
import { namedCriteriaToKeyPaths } from "./named-criteria-to-key-path.fn";
import { normalizeEntities } from "./normalize-entities.fn";

export class Workspace {
    private readonly stores = new Map<string, EntityStore>();

    add(schema: IEntitySchema, items: any[]): void {
        const normalized = normalizeEntities(schema, items);

        for (const schema of normalized.getSchemas()) {
            this.getOrCreateStore(schema).add(normalized.get(schema));
        }
    }

    query(query: Query, schema: IEntitySchema) {
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
                    q => this.query(q, relation.getRelatedEntitySchema()),
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
}
