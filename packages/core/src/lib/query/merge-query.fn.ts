import { or } from "@entity-space/criteria";
import { EntitySelection } from "../expansion/expansion";
import { EntityQuery } from "./entity-query";
import { QueryPaging } from "./query-paging";

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
    const equivalentExpansion = a.getExpansion().equivalent(b.getExpansion());

    if (pagingA || pagingB) {
        if (pagingA && !pagingB) {
            if (equivalentCriteria && equivalentExpansion) {
                return b;
            } else {
                return false;
            }
        } else if (!pagingA && pagingB) {
            if (equivalentCriteria && equivalentExpansion) {
                return a;
            } else {
                return false;
            }
        } else if (pagingA && pagingB) {
            if (equivalentCriteria) {
                if (pagingA.equivalent(pagingB)) {
                    if (equivalentExpansion) {
                        return a; // could also return b, as everything is equivalent
                    } else {
                        return new EntityQuery({
                            entitySchema: a.getEntitySchema(),
                            options: a.getOptions(),
                            criteria: a.getCriteria(),
                            expansion: a.getExpansion().merge(b.getExpansion()),
                            paging: a.getPaging(),
                        });
                    }
                } else {
                    if (pagingA.equivalentSort(pagingB)) {
                        if (equivalentExpansion) {
                            const mergedRange = pagingA.mergeRange(pagingB);

                            if (mergedRange) {
                                return new EntityQuery({
                                    entitySchema: a.getEntitySchema(),
                                    options: a.getOptions(),
                                    criteria: a.getCriteria(),
                                    expansion: a.getExpansion(),
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
            expansion: EntitySelection.mergeValues(a.getEntitySchema(), a.getExpansionValue(), b.getExpansionValue()),
            options,
            paging,
        });
    }

    const mergedCriteria = a.getCriteria().merge(b.getCriteria());

    if (equivalentExpansion) {
        if (mergedCriteria !== false) {
            return new EntityQuery({
                entitySchema,
                options,
                criteria: mergedCriteria,
                expansion: a.getExpansionValue(),
            });
        } else {
            return new EntityQuery({
                entitySchema,
                criteria: or(a.getCriteria(), b.getCriteria()),
                expansion: a.getExpansionValue(),
                options,
            });
        }
    }

    return false;
}
