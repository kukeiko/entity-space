import { permutateEntries } from "@entity-space/utils";
import { Expansion } from "../expansion/public";
import { Query } from "../query/public";
import { Schema } from "../schema/schema";
import { SchemaCatalog_Interface } from "../schema/schema-catalog";
import { createCriteriaTemplateForIndex } from "./create-criteria-template-for-index.fn";
import { expandRelation } from "./expand-relation.fn";
import { flattenNamedCriteria } from "./flatten-named-criteria.fn";
import { namedCriteriaToKeyPaths } from "./named-criteria-to-key-path.fn";
import { normalizeEntities } from "./normalize-entities.fn";
import { ObjectStore } from "./object-store";

export class Workspace {
    constructor(catalog: SchemaCatalog_Interface) {
        this.catalog = catalog;

        // for (const schema of catalog.getSchemas().filter(SchemaV1.hasKey)) {
        for (const schema of catalog.getSchemas()) {
            if (!schema.hasKey()) continue;
            this.stores.set(schema.getSchemaName(), new ObjectStore(schema));
        }
    }

    private readonly catalog: SchemaCatalog_Interface;
    private readonly stores = new Map<string, ObjectStore>();

    add(model: string, items: any[]): void {
        const normalized = normalizeEntities(model, items, this.catalog);

        for (const model in normalized) {
            this.getStore(model).add(normalized[model]);
        }
    }

    query(query: Query) {
        const indexes = this.getSchema(query.model)
            .getAllIndexes()
            .slice()
            .sort((a, b) => b.path.length - a.path.length);

        const criteriaTemplates = indexes.map(index => createCriteriaTemplateForIndex(index));
        const [remappedCriteria] = query.criteria.remap(criteriaTemplates);

        let items: any[] = [];
        const store = this.getStore(query.model);

        if (remappedCriteria === false) {
            items = store.getAll();
        } else {
            // load items from store using index
            for (const remappedCriterion of remappedCriteria) {
                const bagKeyPaths = namedCriteriaToKeyPaths(remappedCriterion);
                const index = store.getIndexMatchingKeyPaths(bagKeyPaths);
                const bagWithPrimitives = flattenNamedCriteria(remappedCriterion);
                const permutatedBags = permutateEntries(bagWithPrimitives);
                const indexValues: any[][] = [];

                for (const permutatedBag of permutatedBags) {
                    const indexValue: any[] = [];

                    for (const key of index.path) {
                        indexValue.push(permutatedBag[key]);
                    }

                    indexValues.push(indexValue);
                }

                items = [...items, ...store.getByIndex(index.name, indexValues)];
            }
        }

        if (Object.keys(query.expansion).length > 0) {
            this.expand(query.model, query.expansion, items);
        }

        return query.criteria.filter(items);
    }

    expand(model: string, expansion: Expansion, items: any[]): any {
        let schema = this.getSchema(model);

        // [todo] dirty
        const nominalSchema = schema.getNominalSchema();

        if (nominalSchema !== schema) {
            schema = nominalSchema;
        }

        for (const propertyKey in expansion) {
            const expansionValue = expansion[propertyKey];
            const property = schema.getProperty(propertyKey);
            // [todo] support nested paths
            const relation = schema.getRelations().find(relation => relation.path === propertyKey);

            if (relation !== void 0) {
                expandRelation(
                    schema,
                    relation,
                    items,
                    q => this.query(q),
                    expansionValue === true ? void 0 : expansionValue
                );
                // this.expandOne(model, propertyKey, items, expansionValue === true ? void 0 : expansionValue);
                // } else if (property.isNavigable()) {
            } else if (property.isNavigable()) {
                if (expansionValue === true) {
                    // [todo] not yet sure if this should be considered a user error.
                    // so for now we'll just throw so i definitely notice it in case it happens.
                    throw new Error(
                        `trying to expand a value that has no link; and no deeper expansion was provided: ${model}.${propertyKey}`
                    );
                } else if (expansionValue !== void 0) {
                    const referencedItems: any[] = [];

                    for (const item of items) {
                        const reference = item[propertyKey];

                        if (Array.isArray(reference)) {
                            referencedItems.push(...reference);
                        } else {
                            referencedItems.push(reference);
                        }
                    }

                    this.expand(property.getSchemaName(), expansionValue, referencedItems);
                }
            } else {
                throw new Error(`can't expand ${model}.${propertyKey}: not a navigable/expandable property`);
            }
        }
    }

    private getStore(model: string): ObjectStore {
        const store = this.stores.get(model);

        if (store === void 0) {
            throw new Error(`store not found: ${model}`);
        }

        return store;
    }

    private getSchema(model: string): Schema {
        return this.catalog.getSchema(model);
    }
}
