import { or } from "@entity-space/criteria";
import { reduceExpansion } from "../expansion/public";
import { Query } from "./query";

// [todo] clean up this method, it is really hard to read and hacked together.
export function mergeQuery(a: Query, b: Query): false | Query {
    if (a.entitySchema.getId() !== b.entitySchema.getId()) {
        return false;
    }

    const mergedCriteria = a.criteria.merge(b.criteria);
    const expandReduced_A_by_B = reduceExpansion(a.expansion, b.expansion);
    const expandReduced_B_by_A = reduceExpansion(b.expansion, a.expansion);

    const aIsSubsetOfB = expandReduced_A_by_B !== false && Object.keys(expandReduced_A_by_B).length === 0;
    const bIsSubsetOfA = expandReduced_B_by_A !== false && Object.keys(expandReduced_B_by_A).length === 0;

    if (aIsSubsetOfB && bIsSubsetOfA && mergedCriteria === false) {
        return { criteria: or(a.criteria, b.criteria), entitySchema: a.entitySchema, expansion: a.expansion };
    }

    if (mergedCriteria === false) {
        return false;
    }

    if (aIsSubsetOfB && bIsSubsetOfA) {
        // equal expansion
        return {
            criteria: mergedCriteria,
            entitySchema: a.entitySchema,
            expansion: a.expansion,
        };
    } else if (aIsSubsetOfB) {
        if (a.criteria.reduce(b.criteria) === true && b.criteria.reduce(a.criteria) === true) {
            // equal criteria
            return {
                criteria: mergedCriteria,
                entitySchema: a.entitySchema,
                expansion: b.expansion,
            };
        } else if (b.criteria.reduce(a.criteria) === true) {
            return {
                criteria: mergedCriteria,
                entitySchema: a.entitySchema,
                expansion: b.expansion,
            };
        }
    } else if (bIsSubsetOfA) {
        if (a.criteria.reduce(b.criteria) === true && b.criteria.reduce(a.criteria) === true) {
            // equal criteria
            return {
                criteria: mergedCriteria,
                entitySchema: a.entitySchema,
                expansion: a.expansion,
            };
        } else if (a.criteria.reduce(b.criteria) === true) {
            return {
                criteria: mergedCriteria,
                entitySchema: b.entitySchema,
                expansion: a.expansion,
            };
        }
    }
    
    return false;
}
