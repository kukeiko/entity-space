import { or } from "@entity-space/criteria";
import { Expansion } from "../public";
import { Query } from "./query";

// [todo] clean up this method, it is really hard to read and hacked together.
export function mergeQuery(a: Query, b: Query): false | Query {
    if (a.getEntitySchema().getId() !== b.getEntitySchema().getId()) {
        return false;
    }

    const entitySchema = a.getEntitySchema();

    if (a.getCriteria().equivalent(b.getCriteria())) {
        // same identity, just merge expansions
        return new Query(
            entitySchema,
            a.getCriteria(),
            Expansion.mergeObjects(a.getExpansionObject(), b.getExpansionObject())
        );
    }

    const mergedCriteria = a.getCriteria().merge(b.getCriteria());
    const expandReduced_A_by_B = b.getExpansion().reduce(a.getExpansion());
    const expandReduced_B_by_A = a.getExpansion().reduce(b.getExpansion());

    const aIsSubsetOfB = expandReduced_A_by_B !== false && Object.keys(expandReduced_A_by_B).length === 0;
    const bIsSubsetOfA = expandReduced_B_by_A !== false && Object.keys(expandReduced_B_by_A).length === 0;

    if (aIsSubsetOfB && bIsSubsetOfA && mergedCriteria === false) {
        return new Query(entitySchema, or(a.getCriteria(), b.getCriteria()), a.getExpansionObject());
    }

    if (mergedCriteria === false) {
        return false;
    }

    if (aIsSubsetOfB && bIsSubsetOfA) {
        // equal expansion
        return new Query(entitySchema, mergedCriteria, a.getExpansionObject());
    } else if (aIsSubsetOfB) {
        // [todo] use criterion.equivalent()
        if (a.getCriteria().reduce(b.getCriteria()) === true && b.getCriteria().reduce(a.getCriteria()) === true) {
            // equal criteria
            return new Query(entitySchema, mergedCriteria, b.getExpansionObject());
        } else if (b.getCriteria().reduce(a.getCriteria()) === true) {
            // [todo] redundant?
            return new Query(entitySchema, mergedCriteria, b.getExpansionObject());
        }
    } else if (bIsSubsetOfA) {
        // [todo] use criterion.equivalent()
        if (a.getCriteria().reduce(b.getCriteria()) === true && b.getCriteria().reduce(a.getCriteria()) === true) {
            // equal criteria
            return new Query(entitySchema, mergedCriteria, a.getExpansionObject());
        } else if (a.getCriteria().reduce(b.getCriteria()) === true) {
            // [todo] redundant?
            return new Query(entitySchema, mergedCriteria, a.getExpansionObject());
        }
    }

    return false;
}
