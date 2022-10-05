import { Query } from "./query";

// [todo] shouldn't be able to reduce queries w/ different entity-schemas
export function reduceQuery(a: Query, b: Query): Query[] | false {
    // [todo] not sure why i'm checking against undefined
    const reducedCriteria =
        b.getCriteria() === void 0
            ? true
            : a.getCriteria() === void 0
            ? false
            : b.getCriteria().reduce(a.getCriteria());

    const reducedExpansion = b.getExpansion().reduce(a.getExpansion());

    if (!reducedCriteria || !reducedExpansion) {
        return false;
    } else if (reducedCriteria === true) {
        if (reducedExpansion === true) {
            return [];
        }

        const query = new Query({ entitySchema: a.getEntitySchema(), criteria: a.getCriteria(), expansion: reducedExpansion.getValue() });
        return [query];
    } else if (reducedExpansion === true) {
        const query = new Query({ entitySchema: a.getEntitySchema(), criteria: reducedCriteria, expansion: a.getExpansionValue() });
        return [query];
    } else {
        return [
            new Query({ entitySchema: a.getEntitySchema(), criteria: reducedCriteria, expansion: a.getExpansionValue() }),
            new Query({ entitySchema: a.getEntitySchema(), criteria: b.getCriteria(), expansion: reducedExpansion.getValue() }),
        ];
    }
}
