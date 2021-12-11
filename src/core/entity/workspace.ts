import { permutateEntries } from "../../utils/permutate-entries.fn";
import { InNumberSetCriterion, InSetCriterion, NamedCriteria, NamedCriteriaBagTemplate, NamedCriteriaTemplate } from "../public";
import { Query } from "../query/public";
import { ObjectStore } from "./object-store";
import { ObjectStoreIndex } from "./object-store-index";

export class Workspace {
    private stores = new Map<string, ObjectStore>();

    executeQuery(query: Query) {
        const store = this.stores.get(query.model);

        if (store === void 0) {
            throw new Error(`store not found: ${query.model}`);
        }

        const criteriaTemplates: NamedCriteriaTemplate<{ [key: string]: typeof InNumberSetCriterion[] }>[] = [];

        const storeIndexes = store
            .getIndexes()
            .slice()
            // we want most narrow indexes first
            .sort((a, b) => b.getKeyPath().length - a.getKeyPath().length);

        for (const index of storeIndexes) {
            const keyPath = index.getKeyPath();

            if (index.key.some(key => key.split(".").length > 2)) {
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
                                bagWithPrimitives[`${property}.${property_2}`] = Array.from(criterionInBag_2.getValues());
                            }
                        }
                    }
                }

                const permutatedBags = permutateEntries(bagWithPrimitives);
                const indexValues: any[][] = [];

                for (const permutatedBag of permutatedBags) {
                    const indexValue: any[] = [];

                    for (const key of index.getKeyPath()) {
                        indexValue.push(permutatedBag[key]);
                    }

                    indexValues.push(indexValue);
                }

                items = [...items, ...store.getByIndex(index.name, indexValues)];
            }
        } else {
            items = store.getAll();
        }

        return query.criteria.filter(items);
    }

    addStore(store: ObjectStore): void {
        this.stores.set(store.name, store);
    }
}
