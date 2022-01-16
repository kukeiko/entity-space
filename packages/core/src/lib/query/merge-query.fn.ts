import { or } from "../criteria/public";
import { reduceExpansion } from "../expansion/public";
import { Query } from "./query";

// [todo] shouldn't be able to merge queries w/ different entity-schemas
export function mergeQuery(a: Query, b: Query): false | Query[] {
    const mergedCriteria = a.criteria.merge(b.criteria);
    const aIsSubsetOfB = Object.keys(reduceExpansion(a.expansion, b.expansion)).length === 0;
    const bIsSubsetOfA = Object.keys(reduceExpansion(b.expansion, a.expansion)).length === 0;

    if (aIsSubsetOfB && bIsSubsetOfA && mergedCriteria === false) {
        return [{ criteria: or(a.criteria, b.criteria), entitySchema: a.entitySchema, expansion: a.expansion }];
    }

    if (mergedCriteria === false) {
        return false;
    }

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
