import { or } from "@entity-space/criteria";
import { reduceExpansion } from "../expansion/public";
import { Query } from "./query";

// [todo] clean up this method, it is really hard to read and hacked together.
export function mergeQuery(a: Query, b: Query): false | Query {
    if (a.getEntitySchema().getId() !== b.getEntitySchema().getId()) {
        return false;
    }

    const entitySchema = a.getEntitySchema();
    const mergedCriteria = a.getCriteria().merge(b.getCriteria());
    const expandReduced_A_by_B = reduceExpansion(a.getExpansion(), b.getExpansion());
    const expandReduced_B_by_A = reduceExpansion(b.getExpansion(), a.getExpansion());

    const aIsSubsetOfB = expandReduced_A_by_B !== false && Object.keys(expandReduced_A_by_B).length === 0;
    const bIsSubsetOfA = expandReduced_B_by_A !== false && Object.keys(expandReduced_B_by_A).length === 0;

    if (aIsSubsetOfB && bIsSubsetOfA && mergedCriteria === false) {
        return new Query(entitySchema, or(a.getCriteria(), b.getCriteria()), a.getExpansion());
    }

    if (mergedCriteria === false) {
        return false;
    }

    if (aIsSubsetOfB && bIsSubsetOfA) {
        // equal expansion
        return new Query(entitySchema, mergedCriteria, a.getExpansion());
    } else if (aIsSubsetOfB) {
        // [todo] use criterion.equivalent()
        if (a.getCriteria().reduce(b.getCriteria()) === true && b.getCriteria().reduce(a.getCriteria()) === true) {
            // equal criteria
            return new Query(entitySchema, mergedCriteria, b.getExpansion());
        } else if (b.getCriteria().reduce(a.getCriteria()) === true) {
            // [todo] redundant?
            return new Query(entitySchema, mergedCriteria, b.getExpansion());
        }
    } else if (bIsSubsetOfA) {
        // [todo] use criterion.equivalent()
        if (a.getCriteria().reduce(b.getCriteria()) === true && b.getCriteria().reduce(a.getCriteria()) === true) {
            // equal criteria
            return new Query(entitySchema, mergedCriteria, a.getExpansion());
        } else if (a.getCriteria().reduce(b.getCriteria()) === true) {
            // [todo] redundant?
            return new Query(entitySchema, mergedCriteria, a.getExpansion());
        }
    }

    return false;
}
