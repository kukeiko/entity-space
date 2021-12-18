import { permutateEntries } from "../../utils/permutate-entries.fn";
import { InNumberSetCriterion, InSetCriterion, NamedCriteria, NamedCriteriaTemplate } from "../criteria/public";
import { Query } from "../query/public";
import { ObjectStore } from "./object-store";
import { Schema } from "./metadata/schema";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";
import { Expansion } from "../expansion/public";
import { SchemaCatalog } from "./metadata/schema-catalog";
import { normalizeEntities } from "./normalize-entities.fn";

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
        const store = this.stores.get(query.model);

        if (store === void 0) {
            throw new Error(`store not found: ${query.model}`);
        }

        const criteriaTemplates: NamedCriteriaTemplate<{ [key: string]: typeof InNumberSetCriterion[] }>[] = [];

        const storeIndexes = store
            .getIndexes()
            .slice()
            // we want most narrow indexes first
            .sort((a, b) => b.path.length - a.path.length);

        for (const index of storeIndexes) {
            const keyPath = index.path;

            if (index.path.some(key => key.split(".").length > 2)) {
                throw new Error(`arbitrary depth of nested index paths not yet supported`);
            }

            // [todo] would like to use this line, but need to introduce generic for it.
            // don't wanna do now cause i need to thoroughly check places for "infinitely deep" stuff,
            // and right now im too lazy.
            // const namedBagTemplate: NamedCriteriaBagTemplate = {} ;
            const namedBagTemplate: { [key: string]: typeof InNumberSetCriterion[] } = {};

            for (const key of keyPath) {
                if (key.includes(".")) {
                    // [todo] support more than 1 level of nesting
                    const [first, second] = key.split(".");

                    if (!namedBagTemplate[first]) {
                        namedBagTemplate[first] = [new NamedCriteriaTemplate({})] as any;
                    }

                    (namedBagTemplate[first][0] as any).items[second] = [InNumberSetCriterion];
                } else {
                    // [todo] i was a bit suprised that i have to supply an array; was a bit unintuitive
                    namedBagTemplate[key] = [InNumberSetCriterion];
                }
            }

            criteriaTemplates.push(new NamedCriteriaTemplate(namedBagTemplate));
        }

        const [remappedCriteria] = query.criteria.remap(criteriaTemplates);

        let items: any[] = [];

        if (remappedCriteria !== false) {
            // load items from store using index
            for (const remappedCriterion of remappedCriteria) {
                const bag = remappedCriterion.getBag();
                const bagKeyPaths: string[] = [];

                for (const property in bag) {
                    const criterionInBag = bag[property];

                    // [todo] support more than 1 level of nesting
                    if (criterionInBag instanceof NamedCriteria) {
                        for (const property_2 in criterionInBag.getBag()) {
                            bagKeyPaths.push(`${property}.${property_2}`);
                        }
                    } else {
                        bagKeyPaths.push(property);
                    }
                }

                const index = store.getIndexMatchingKeyPaths(bagKeyPaths);
                const bagWithPrimitives: Record<string, any> = {};

                for (const property in bag) {
                    const criterionInBag = bag[property] as any;

                    if (criterionInBag instanceof InSetCriterion) {
                        bagWithPrimitives[property] = Array.from(criterionInBag.getValues());
                    } else if (criterionInBag instanceof NamedCriteria) {
                        for (const property_2 in criterionInBag.getBag()) {
                            const criterionInBag_2 = criterionInBag.getBag()[property_2];

                            if (criterionInBag_2 instanceof InSetCriterion) {
                                // [todo] support more than 1 level of nesting
                                bagWithPrimitives[`${property}.${property_2}`] = Array.from(
                                    criterionInBag_2.getValues()
                                );
                            }
                        }
                    }
                }

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
        } else {
            items = store.getAll();
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
