import { InNumberSetCriterion, NamedCriteriaTemplate } from "../public";
import { Query } from "../query/public";
import { ObjectStore } from "./object-store";

export class Workspace {
    private stores = new Map<string, ObjectStore>();

    executeQuery(query: Query) {
        const store = this.stores.get(query.model);

        if (store === void 0) {
            throw new Error(`store not found: ${query.model}`);
        }

        const criteriaTemplates: NamedCriteriaTemplate<{ [key: string]: typeof InNumberSetCriterion[] }>[] = [];

        for (const index of store.getIndexes()) {
            if (index.key.length > 1 || index.key.some(key => key.includes("."))) {
                // for now, we only support non-nested, non-composite indexes
                continue;
            }

            const key = index.key[0];
            const criteriaTemplate = new NamedCriteriaTemplate({
                // [todo] i was a bit suprised that i have to supply an array; was a bit unintuitive
                [key]: [InNumberSetCriterion],
            });

            criteriaTemplates.push(criteriaTemplate);
        }

        const [remappedCriteria] = query.criteria.remap(criteriaTemplates);

        let items: any[] = [];

        if (remappedCriteria !== false) {
            // load items from store using index
            for (const remappedCriterion of remappedCriteria) {
                const bag = remappedCriterion.getBag();

                for (const property in remappedCriterion.getBag()) {
                    const values = bag[property]?.getValues() ?? new Set();
                    items = [...items, ...store.getByIndex(property, Array.from(values.values()))];
                }
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
