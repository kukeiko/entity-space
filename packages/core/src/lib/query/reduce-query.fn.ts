import { Criterion } from "@entity-space/criteria";
import { Expansion } from "../expansion/expansion";
import { EntityQueryCtorArg, Query } from "./query";

type ReducedParts = { options: Criterion | boolean; criteria: Criterion | boolean; expansion: Expansion | boolean };

type WithoutFalse<T> = {
    [K in keyof T]: Exclude<T[K], false>;
};

function containsNoFalse(parts: ReducedParts): parts is WithoutFalse<ReducedParts> {
    return !Object.values(parts).some(part => part === false);
}

// [todo] shouldn't be able to reduce queries w/ different entity-schemas
export function reduceQuery(a: Query, b: Query): Query[] | false {
    const reduction: { options: Criterion | boolean; criteria: Criterion | boolean; expansion: Expansion | boolean } = {
        options: b.getOptions().reduce(a.getOptions()),
        criteria: b.getCriteria().reduce(a.getCriteria()),
        expansion: b.getExpansion().reduce(a.getExpansion()),
    };

    if (!containsNoFalse(reduction)) {
        return false;
    } else if (Object.values(reduction).every(reduced => reduced === true)) {
        return [];
    }

    const reducedQueries: Query[] = [];
    const accumulated: EntityQueryCtorArg = {
        entitySchema: a.getEntitySchema(),
        criteria: a.getCriteria(),
        expansion: a.getExpansion(),
        options: a.getOptions(),
    };

    if (reduction.options !== true) {
        reducedQueries.push(new Query({ ...accumulated, options: reduction.options }));
        accumulated.options = b.getOptions();
    }

    if (reduction.criteria !== true) {
        reducedQueries.push(new Query({ ...accumulated, criteria: reduction.criteria }));
        accumulated.criteria = b.getCriteria();
    }

    if (reduction.expansion !== true) {
        reducedQueries.push(new Query({ ...accumulated, expansion: reduction.expansion }));
        accumulated.expansion = b.getExpansion();
    }

    return reducedQueries;
}
