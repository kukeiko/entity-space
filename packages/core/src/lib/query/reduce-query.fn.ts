import { Query } from "./query";

// [todo] shouldn't be able to reduce queries w/ different entity-schemas
export function reduceQuery(a: Query, b: Query): Query[] | false {
    const reducedCriteria = b.getCriteria().reduce(a.getCriteria());
    const reducedExpansion = b.getExpansion().reduce(a.getExpansion());

    if (!reducedCriteria || !reducedExpansion) {
        return false;
    } else if (reducedCriteria === true && reducedExpansion === true) {
        return [];
    } else if (reducedCriteria === true && reducedExpansion !== true) {
        const query = new Query({
            entitySchema: a.getEntitySchema(),
            criteria: a.getCriteria(),
            expansion: reducedExpansion.getValue(),
        });
        return [query];
    } else if (reducedCriteria !== true && reducedExpansion === true) {
        const query = new Query({
            entitySchema: a.getEntitySchema(),
            criteria: reducedCriteria,
            expansion: a.getExpansionValue(),
        });
        return [query];
    } else if (reducedCriteria !== true && reducedExpansion !== true) {
        return [
            new Query({
                entitySchema: a.getEntitySchema(),
                criteria: reducedCriteria,
                expansion: a.getExpansionValue(),
            }),
            new Query({
                entitySchema: a.getEntitySchema(),
                criteria: b.getCriteria(),
                expansion: reducedExpansion.getValue(),
            }),
        ];
    } else {
        // [todo] figure out why we have to provide this catch-all else case
        throw new Error("can not happen. why does TypeScript complain? am I wrong?");
    }
}
