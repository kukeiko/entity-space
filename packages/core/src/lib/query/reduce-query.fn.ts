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

        const query = new Query(a.getEntitySchema(), a.getCriteria(), reducedExpansion.getObject());
        return [query];
    } else if (reducedExpansion === true) {
        const query = new Query(a.getEntitySchema(), reducedCriteria, a.getExpansionObject());
        return [query];
    } else {
        return [
            new Query(a.getEntitySchema(), reducedCriteria, a.getExpansionObject()),
            new Query(a.getEntitySchema(), b.getCriteria(), reducedExpansion.getObject()),
        ];
    }
}
