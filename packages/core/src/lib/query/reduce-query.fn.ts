import { Criterion } from "@entity-space/criteria";
import { Expansion } from "../expansion/expansion";
import { EntityQueryCtorArg, Query } from "./query";

type ReducedParts = { options: true | Criterion; criteria: true | Criterion; expansion: true | Expansion };

function subtractParts(a: Query, b: Query): false | ReducedParts {
    const options = b.getOptions().reduce(a.getOptions());

    if (!options) {
        return false;
    }

    const criteria = b.getCriteria().reduce(a.getCriteria());

    if (!criteria) {
        return false;
    }

    const expansion = b.getExpansion().reduce(a.getExpansion());

    if (!expansion) {
        return false;
    }

    return { options, criteria, expansion };
}

// [todo] shouldn't be able to reduce queries w/ different entity-schemas
export function reduceQuery(a: Query, b: Query): Query[] | false {
    const reducedParts = subtractParts(a, b);

    if (!reducedParts) {
        return false;
    } else if (Object.values(reducedParts).every(reduced => reduced === true)) {
        return [];
    }

    const reducedQueries: Query[] = [];
    const accumulated: EntityQueryCtorArg = {
        entitySchema: a.getEntitySchema(),
        criteria: a.getCriteria(),
        expansion: a.getExpansion(),
        options: a.getOptions(),
    };

    if (reducedParts.options !== true) {
        reducedQueries.push(new Query({ ...accumulated, options: reducedParts.options }));
        accumulated.options = b.getOptions();
    }

    if (reducedParts.criteria !== true) {
        reducedQueries.push(new Query({ ...accumulated, criteria: reducedParts.criteria }));
        accumulated.criteria = b.getCriteria();
    }

    if (reducedParts.expansion !== true) {
        reducedQueries.push(new Query({ ...accumulated, expansion: reducedParts.expansion }));
        accumulated.expansion = b.getExpansion();
    }

    return reducedQueries;
}
