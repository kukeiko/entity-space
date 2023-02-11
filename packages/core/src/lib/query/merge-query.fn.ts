import { EntityCriteriaFactory } from "../criteria/vnext/entity-criteria-factory";
import { EntityQueryFactory } from "./entity-query-factory";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";
import { QueryPaging } from "./query-paging";

// [todo] clean up this method, it is really hard to read and hacked together.
export function mergeQuery(a: IEntityQuery, b: IEntityQuery): false | IEntityQuery {
    // [todo] hardcoded
    const factory = new EntityQueryFactory({ criteriaFactory: new EntityCriteriaFactory() });

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
                        return factory.createQuery({
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
                                return factory.createQuery({
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
        return factory.createQuery({
            entitySchema,
            criteria: a.getCriteria(),
            selection: EntitySelection.mergeValues(a.getSelection().getValue(), b.getSelection().getValue()),
            options,
            paging,
        });
    }

    const mergedCriteria = a.getCriteria().merge(b.getCriteria());

    if (equivalentSelection) {
        if (mergedCriteria !== false) {
            return factory.createQuery({
                entitySchema,
                options,
                criteria: mergedCriteria,
                selection: a.getSelection().getValue(),
            });
        } else {
            return factory.createQuery({
                entitySchema,
                // [todo] hardcoded
                criteria: new EntityCriteriaFactory().or(a.getCriteria(), b.getCriteria()),
                selection: a.getSelection().getValue(),
                options,
            });
        }
    }

    return false;
}
