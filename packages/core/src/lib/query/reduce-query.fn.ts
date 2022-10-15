import { Criterion } from "@entity-space/criteria";
import { Expansion } from "../expansion/expansion";
import { QueryPaging } from "./query-paging";
import { EntityQueryCtorArg, Query } from "./query";

type ReducedParts = {
    options: true | Criterion;
    criteria: true | Criterion;
    expansion: true | Expansion;
    paging: true | QueryPaging[];
};

function subtractParts(a: Query, b: Query): false | ReducedParts {
    const pagingA = a.getPaging();
    const pagingB = b.getPaging();
    let paging: true | QueryPaging[] = true;

    if (!pagingA && pagingB) {
        return false;
    } else if (pagingA && pagingB) {
        const subractedPaging = pagingB.subtract(pagingA);

        if (!subractedPaging) {
            return false;
        }

        paging = subractedPaging;
    }

    const options = b.getOptions().reduce(a.getOptions());

    if (!options || (options !== true && paging !== true)) {
        return false;
    }

    const criteria = b.getCriteria().reduce(a.getCriteria());

    if (!criteria || (criteria !== true && paging !== true)) {
        return false;
    }

    const expansion = b.getExpansion().reduce(a.getExpansion());

    if (!expansion) {
        return false;
    }

    return { options, criteria, expansion, paging };
}

// [todo] shouldn't be able to reduce queries w/ different entity-schemas
// [todo] it is still unexpected for me that this method returns an empty array on full subtraction,
// but Criterion.reduce() would return true. should make it consistent.
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
        paging: a.getPaging(),
    };

    if (reducedParts.paging !== true) {
        reducedParts.paging.forEach(paging => {
            reducedQueries.push(new Query({ ...accumulated, paging }));
        });

        accumulated.paging = b.getPaging();
    }

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
