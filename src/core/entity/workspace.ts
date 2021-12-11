import { permutateEntries } from "../../utils/permutate-entries.fn";
import { InNumberSetCriterion, NamedCriteriaBagTemplate, NamedCriteriaTemplate } from "../public";
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

            // if (index.key.length > 1 || index.key.some(key => key.includes("."))) {
            if (index.key.some(key => key.includes("."))) {
                // for now, we only support non-nested, non-composite indexes
                // for now we only support non-nested indexes
                continue;
            }

            // [todo] would like to use this line, but need to introduce generic for it.
            // don't wanna do now cause i need to thoroughly check places for "infinitely deep" stuff,
            // and right now im too lazy.
            // const namedBagTemplate: NamedCriteriaBagTemplate = {} ;
            const namedBagTemplate: { [key: string]: typeof InNumberSetCriterion[] } = {};

            for (const key of keyPath) {
                // [todo] i was a bit suprised that i have to supply an array; was a bit unintuitive
                namedBagTemplate[key] = [InNumberSetCriterion];
            }

            criteriaTemplates.push(new NamedCriteriaTemplate(namedBagTemplate));
        }

        const [remappedCriteria] = query.criteria.remap(criteriaTemplates);

        let items: any[] = [];

        if (remappedCriteria !== false) {
            // load items from store using index
            for (const remappedCriterion of remappedCriteria) {
                const bag = remappedCriterion.getBag();
                const bagKeys = Object.keys(bag).sort((a, b) => a.localeCompare(b));
                const bagKeysJson = JSON.stringify(bagKeys);
                let index: ObjectStoreIndex | undefined = void 0;

                for (const indexCandidate of store.getIndexes()) {
                    const indexKeys = indexCandidate.getKeyPath().sort((a, b) => a.localeCompare(b));
                    if (JSON.stringify(indexKeys) === bagKeysJson) {
                        index = indexCandidate;
                        break;
                    }
                }

                if (index === void 0) {
                    throw new Error(`failed to find index matching criteria bag: ${bagKeysJson}`);
                }

                const bagWithPrimitives: Record<string, any> = {};

                for (const property in bag) {
                    bagWithPrimitives[property] = Array.from(bag[property]?.getValues() ?? new Set());
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
