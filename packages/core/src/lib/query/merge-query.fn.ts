import { reduceExpansion } from "../public";
import { Query } from "./query";

// [todo] shouldn't be able to merge queries w/ different entity-schemas
export function mergeQuery(a: Query, b: Query): false | Query[] {
    const mergedCriteria = a.criteria.merge(b.criteria);

    if (mergedCriteria === false) {
        return false;
    }

    const aIsSubsetOfB = Object.keys(reduceExpansion(a.expansion, b.expansion)).length === 0;
    const bIsSubsetOfA = Object.keys(reduceExpansion(b.expansion, a.expansion)).length === 0;

    if (aIsSubsetOfB && bIsSubsetOfA) {
        // equal expansion
        return [
            {
                criteria: mergedCriteria,
                entitySchema: a.entitySchema,
                expansion: a.expansion,
            },
        ];
    } else if (aIsSubsetOfB) {
        return [
            {
                criteria: mergedCriteria,
                entitySchema: a.entitySchema,
                expansion: a.expansion,
            },
            b,
        ];
    } else if (bIsSubsetOfA) {
        return [
            {
                criteria: mergedCriteria,
                entitySchema: b.entitySchema,
                expansion: b.expansion,
            },
            a,
        ];
    } else {
        return false;
    }
}
