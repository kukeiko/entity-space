import { ExpansionValue } from "@entity-space/common";
import { or } from "@entity-space/criteria";
import { Expansion } from "../expansion/expansion";
import { Query } from "./query";

// [todo] clean up this method, it is really hard to read and hacked together.
export function mergeQuery(a: Query, b: Query): false | Query {
    if (a.getEntitySchema().getId() !== b.getEntitySchema().getId()) {
        return false;
    }

    if (!a.getOptions().equivalent(b.getOptions())) {
        return false;
    }

    const options = a.getOptions();
    const entitySchema = a.getEntitySchema();
    const equivalentCriteria = a.getCriteria().equivalent(b.getCriteria());

    if (equivalentCriteria) {
        // same identity, just merge expansions
        return new Query({
            entitySchema,
            criteria: a.getCriteria(),
            expansion: Expansion.mergeValues(a.getEntitySchema(), a.getExpansionValue(), b.getExpansionValue()),
            options
        });
    }

    const mergedCriteria = a.getCriteria().merge(b.getCriteria());
    const expandReduced_A_by_B = b.getExpansion().reduce(a.getExpansion());
    const expandReduced_B_by_A = a.getExpansion().reduce(b.getExpansion());

    const aIsSubsetOfB = expandReduced_A_by_B !== false && Object.keys(expandReduced_A_by_B).length === 0;
    const bIsSubsetOfA = expandReduced_B_by_A !== false && Object.keys(expandReduced_B_by_A).length === 0;
    const equivalentExpansion = aIsSubsetOfB && bIsSubsetOfA;

    if (equivalentExpansion && mergedCriteria === false) {
        return new Query({
            entitySchema,
            criteria: or(a.getCriteria(), b.getCriteria()),
            expansion: a.getExpansionValue(),
            options,
        });
    }

    if (mergedCriteria === false) {
        return false;
    }

    const criteria = mergedCriteria;
    let expansion: ExpansionValue | undefined;

    if (equivalentExpansion) {
        expansion = a.getExpansionValue();
    } else if (aIsSubsetOfB) {
        if (equivalentCriteria) {
            expansion = b.getExpansionValue();
        } else if (b.getCriteria().reduce(a.getCriteria()) === true) {
            // [todo] redundant?
            expansion = b.getExpansionValue();
        }
    } else if (bIsSubsetOfA) {
        if (equivalentCriteria) {
            expansion = a.getExpansionValue();
        } else if (a.getCriteria().reduce(b.getCriteria()) === true) {
            // [todo] redundant?
            expansion = a.getExpansionValue();
        }
    }

    if (expansion) {
        return new Query({ entitySchema, options, criteria, expansion });
    }

    return false;
}
