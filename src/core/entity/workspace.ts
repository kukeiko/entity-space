import { permutateEntries } from "../../utils/permutate-entries.fn";
import { Query } from "../query/public";
import { ObjectStore } from "./object-store";
import { Schema } from "./metadata/schema";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";
import { Expansion } from "../expansion/public";
import { SchemaCatalog } from "./metadata/schema-catalog";
import { normalizeEntities } from "./normalize-entities.fn";
import { createCriteriaTemplateForIndex } from "./create-criteria-template-for-index.fn";
import { namedCriteriaToKeyPaths } from "./named-criteria-to-key-path.fn";
import { flattenNamedCriteria } from "./flatten-named-criteria.fn";

export class Workspace {
    constructor(catalog: SchemaCatalog) {
        this.catalog = catalog;

        for (const schema of catalog.getSchemas().filter(Schema.hasKey)) {
            this.stores.set(schema.name, new ObjectStore(schema));
        }
    }

    private readonly catalog: SchemaCatalog;
    private readonly stores = new Map<string, ObjectStore>();

    add(model: string, items: any[]): void {
        const normalized = normalizeEntities(model, items, this.catalog);

        for (const model in normalized) {
            this.getStore(model).add(normalized[model]);
        }
    }

    query(query: Query) {
        const indexes = this.getSchema(query.model)
            .getIndexes()
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
        const schema = this.getSchema(model);

        for (const propertyKey in expansion) {
            const expansionValue = expansion[propertyKey];
            const property = schema.getProperty(propertyKey);

            if (property.isExpandable()) {
                this.expandOne(model, propertyKey, items, expansionValue === true ? void 0 : expansionValue);
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

                    this.expand(property.model, expansionValue, referencedItems);
                }
            } else {
                throw new Error(`can't expand ${model}.${propertyKey}: not a navigable/expandable property`);
            }
        }
    }

    private expandOne(model: string, propertyKey: string, items: any[], expansion?: Expansion): any {
        const schema = this.getSchema(model);
        const propertySchema = schema.getProperty(propertyKey);
        const link = propertySchema.link;

        if (link === void 0) {
            throw new Error(`can't expand property ${model}.${propertyKey}: no link`);
        }

        const linkedModel = propertySchema.model;

        if (linkedModel === void 0) {
            throw new Error(`can't expand property ${model}.${propertyKey}: no model`);
        }

        const toIndex = this.getSchema(linkedModel).getIndex(link.to);
        const fromIndex = this.getSchema(model).getIndex(link.from);
        const criteria = createCriteriaForIndex(toIndex.path.slice(), fromIndex.read(items));
        const referencedItems = this.query({ criteria, expansion: expansion ?? {}, model: linkedModel });
        const referencedIndex = this.getSchema(linkedModel).getIndex(link.to);

        for (const item of items) {
            const indexValue = this.getSchema(model).getIndex(link.from).readOne(item);
            const matchingReferencedItems = referencedItems.filter(
                item => JSON.stringify(indexValue) === JSON.stringify(referencedIndex.readOne(item))
            );

            if (propertySchema.array) {
                item[propertyKey] = matchingReferencedItems;
            } else {
                item[propertyKey] = matchingReferencedItems[0] ?? null;
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
