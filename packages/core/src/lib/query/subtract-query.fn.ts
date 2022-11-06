import { Criterion } from "@entity-space/criteria";
import { EntitySelection } from "../expansion/expansion";
import { EntityQueryCtorArg, EntityQuery } from "./entity-query";
import { QueryPaging } from "./query-paging";

type ReducedParts = {
    options: true | Criterion;
    criteria: true | Criterion;
    expansion: true | EntitySelection;
    paging: true | QueryPaging[];
};

function subtractParts(a: EntityQuery, b: EntityQuery): false | ReducedParts {
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

        if (!b.getOptions().equivalent(a.getOptions())) {
            return false;
        }

        if (!b.getCriteria().equivalent(a.getCriteria())) {
            return false;
        }

        const expansion = b.getExpansion().subtractFrom(a.getExpansion());

        if (!expansion) {
            return false;
        }
    }

    const options = b.getOptions().subtractFrom(a.getOptions());

    if (!options || (options !== true && paging !== true)) {
        return false;
    }

    const criteria = b.getCriteria().subtractFrom(a.getCriteria());

    if (!criteria || (criteria !== true && paging !== true)) {
        return false;
    }

    const expansion = b.getExpansion().subtractFrom(a.getExpansion());

    if (!expansion) {
        return false;
    }

    return { options, criteria, expansion, paging };
}

// [todo] shouldn't be able to reduce queries w/ different entity-schemas
// [todo] it is still unexpected for me that this method returns an empty array on full subtraction,
// but Criterion.reduce() would return true. should make it consistent.
export function subtractQuery(a: EntityQuery, b: EntityQuery): EntityQuery[] | false {
    const reducedParts = subtractParts(a, b);

    if (!reducedParts) {
        return false;
    } else if (Object.values(reducedParts).every(reduced => reduced === true)) {
        return [];
    }

    const reducedQueries: EntityQuery[] = [];
    const accumulated: EntityQueryCtorArg = {
        entitySchema: a.getEntitySchema(),
        criteria: a.getCriteria(),
        expansion: a.getExpansion(),
        options: a.getOptions(),
        paging: a.getPaging(),
    };

    if (reducedParts.paging !== true) {
        reducedParts.paging.forEach(paging => {
            reducedQueries.push(new EntityQuery({ ...accumulated, paging }));
        });

        accumulated.paging = b.getPaging();
    }

    if (reducedParts.options !== true) {
        reducedQueries.push(new EntityQuery({ ...accumulated, options: reducedParts.options }));
        accumulated.options = b.getOptions();
    }

    if (reducedParts.criteria !== true) {
        reducedQueries.push(new EntityQuery({ ...accumulated, criteria: reducedParts.criteria }));
        accumulated.criteria = b.getCriteria();
    }

    if (reducedParts.expansion !== true) {
        reducedQueries.push(new EntityQuery({ ...accumulated, expansion: reducedParts.expansion }));
        accumulated.expansion = b.getExpansion();
    }

    return reducedQueries;
}
