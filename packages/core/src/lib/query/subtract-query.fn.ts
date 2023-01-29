import { EntitySelection } from "./entity-selection";
import { EntityQueryCtorArg, EntityQuery } from "./entity-query";
import { QueryPaging } from "./query-paging";
import { Criterion } from "../criteria/criterion/criterion";

type SubtractedParts = {
    options: true | Criterion;
    criteria: true | Criterion;
    selection: true | EntitySelection;
    paging: true | QueryPaging[];
};

function subtractParts(a: EntityQuery, b: EntityQuery): false | SubtractedParts {
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

        const selection = b.getSelection().subtractFrom(a.getSelection());

        if (!selection) {
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

    const selection = b.getSelection().subtractFrom(a.getSelection());

    if (!selection) {
        return false;
    }

    return { options, criteria, selection, paging };
}

// [todo] shouldn't be able to reduce queries w/ different entity-schemas
// [todo] it is still unexpected for me that this method returns an empty array on full subtraction,
// but Criterion.reduce() would return true. should make it consistent.
export function subtractQuery(a: EntityQuery, b: EntityQuery): EntityQuery[] | false {
    const subtracted = subtractParts(a, b);

    if (!subtracted) {
        return false;
    } else if (Object.values(subtracted).every(reduced => reduced === true)) {
        return [];
    }

    const subtractedQueries: EntityQuery[] = [];
    const accumulated: EntityQueryCtorArg = {
        entitySchema: a.getEntitySchema(),
        criteria: a.getCriteria(),
        selection: a.getSelection(),
        options: a.getOptions(),
        paging: a.getPaging(),
    };

    if (subtracted.paging !== true) {
        subtracted.paging.forEach(paging => {
            subtractedQueries.push(new EntityQuery({ ...accumulated, paging }));
        });

        accumulated.paging = b.getPaging();
    }

    if (subtracted.options !== true) {
        subtractedQueries.push(new EntityQuery({ ...accumulated, options: subtracted.options }));
        accumulated.options = b.getOptions();
    }

    if (subtracted.criteria !== true) {
        subtractedQueries.push(new EntityQuery({ ...accumulated, criteria: subtracted.criteria }));
        // [todo] should we also do intersection for paging & options?
        const intersection = a.getCriteria().intersect(b.getCriteria());

        if (intersection === false) {
            throw new Error("invalid criterion implementation");
        } else {
            accumulated.criteria = intersection;
        }
    }

    if (subtracted.selection !== true) {
        subtractedQueries.push(new EntityQuery({ ...accumulated, selection: subtracted.selection }));
    }

    return subtractedQueries;
}
