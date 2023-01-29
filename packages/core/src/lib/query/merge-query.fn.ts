import { EntitySelection } from "./entity-selection";
import { EntityQuery } from "./entity-query";
import { QueryPaging } from "./query-paging";
import { or } from "../criteria/criterion/or/or.fn";

// [todo] clean up this method, it is really hard to read and hacked together.
export function mergeQuery(a: EntityQuery, b: EntityQuery): false | EntityQuery {
    if (a.getEntitySchema().getId() !== b.getEntitySchema().getId()) {
        return false;
    }

    if (!a.getOptions().equivalent(b.getOptions())) {
        return false;
    }

    const pagingA = a.getPaging();
    const pagingB = b.getPaging();
    const equivalentCriteria = a.getCriteria().equivalent(b.getCriteria());
    const equivalentSelection = a.getSelection().equivalent(b.getSelection());

    if (pagingA || pagingB) {
        if (pagingA && !pagingB) {
            if (equivalentCriteria && equivalentSelection) {
                return b;
            } else {
                return false;
            }
        } else if (!pagingA && pagingB) {
            if (equivalentCriteria && equivalentSelection) {
                return a;
            } else {
                return false;
            }
        } else if (pagingA && pagingB) {
            if (equivalentCriteria) {
                if (pagingA.equivalent(pagingB)) {
                    if (equivalentSelection) {
                        return a; // could also return b, as everything is equivalent
                    } else {
                        return new EntityQuery({
                            entitySchema: a.getEntitySchema(),
                            options: a.getOptions(),
                            criteria: a.getCriteria(),
                            selection: a.getSelection().merge(b.getSelection()),
                            paging: a.getPaging(),
                        });
                    }
                } else {
                    if (pagingA.equivalentSort(pagingB)) {
                        if (equivalentSelection) {
                            const mergedRange = pagingA.mergeRange(pagingB);

                            if (mergedRange) {
                                return new EntityQuery({
                                    entitySchema: a.getEntitySchema(),
                                    options: a.getOptions(),
                                    criteria: a.getCriteria(),
                                    selection: a.getSelection(),
                                    paging: new QueryPaging({
                                        sort: pagingA.getSort(),
                                        from: mergedRange.getFrom()?.value,
                                        to: mergedRange.getTo()?.value,
                                    }),
                                });
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
    }

    const paging = pagingA;
    const options = a.getOptions();
    const entitySchema = a.getEntitySchema();

    if (equivalentCriteria) {
        // same identity, just merge expansions
        return new EntityQuery({
            entitySchema,
            criteria: a.getCriteria(),
            selection: EntitySelection.mergeValues(a.getSelectionValue(), b.getSelectionValue()),
            options,
            paging,
        });
    }

    const mergedCriteria = a.getCriteria().merge(b.getCriteria());

    if (equivalentSelection) {
        if (mergedCriteria !== false) {
            return new EntityQuery({
                entitySchema,
                options,
                criteria: mergedCriteria,
                selection: a.getSelectionValue(),
            });
        } else {
            return new EntityQuery({
                entitySchema,
                criteria: or(a.getCriteria(), b.getCriteria()),
                selection: a.getSelectionValue(),
                options,
            });
        }
    }

    return false;
}
