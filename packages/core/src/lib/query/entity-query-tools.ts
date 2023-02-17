import { Entity } from "../common/entity.type";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { IEntityCriteriaTools } from "../criteria/vnext/entity-criteria-tools.interface";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQuery } from "./entity-query";
import { EntityQueryCreate, IEntityQueryTools } from "./entity-query-tools.interface";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";
import { parseQuery } from "./parse-query.fn";
import { QueryPaging } from "./query-paging";

type SubtractedParts = {
    options: true | ICriterion;
    criteria: true | ICriterion;
    selection: true | EntitySelection;
    paging: true | QueryPaging[];
};

export class EntityQueryTools implements IEntityQueryTools {
    constructor({ criteriaFactory }: { criteriaFactory: IEntityCriteriaTools }) {
        this.criteriaTools = criteriaFactory;
    }

    private readonly criteriaTools: IEntityCriteriaTools;

    createQuery(args: Omit<EntityQueryCreate, "factory">): IEntityQuery {
        let { entitySchema, criteria, options, paging, selection } = args;

        return new EntityQuery({
            factory: this,
            entitySchema,
            criteria: criteria ?? this.criteriaTools.all(),
            options: options ?? this.criteriaTools.never(),
            paging,
            selection:
                selection === void 0
                    ? new EntitySelection({ schema: entitySchema, value: entitySchema.getDefaultSelection() })
                    : selection instanceof EntitySelection
                    ? selection
                    : new EntitySelection({ schema: entitySchema, value: selection }),
        });
    }

    createIdQueryFromEntities(schema: IEntitySchema, entities: Entity[]): IEntityQuery {
        const indexCriteria = this.criteriaTools.createCriterionFromEntities(entities, schema.getKey().getPath());

        return this.createQuery({
            entitySchema: schema,
            criteria: indexCriteria,
        });
    }

    createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): IEntityQuery[] {
        const queries: IEntityQuery[] = [];

        // [todo] also implement other indexes
        if (schema.hasKey()) {
            queries.push(this.createIdQueryFromEntities(schema, entities));
        }

        return queries;
    }

    mergeQueries(...queries: IEntityQuery[]): IEntityQuery[] {
        if (!queries.length) {
            return [];
        }

        let merged: IEntityQuery[] = queries.slice();
        let nextMerged: IEntityQuery[] = [];

        for (let i = 0; i < merged.length; ++i) {
            let query = merged[i];
            let didMerge = false;

            for (let e = 0; e < merged.length; ++e) {
                if (e == i) {
                    continue;
                }

                const other = merged[e];
                const result = this.mergeQuery(query, other);

                if (result) {
                    nextMerged.push(result);
                    didMerge = true;
                    query = result;
                } else {
                    nextMerged.push(other);
                }
            }

            if (didMerge) {
                i = 0;
            } else {
                nextMerged.unshift(query);
            }

            merged = nextMerged.slice();
            nextMerged = [];
        }

        return merged;
    }

    // [todo] clean up this method, it is really hard to read and hacked together.
    mergeQuery(a: IEntityQuery, b: IEntityQuery): false | IEntityQuery {
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
                            return this.createQuery({
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
                                    return this.createQuery({
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
            return this.createQuery({
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
                return this.createQuery({
                    entitySchema,
                    options,
                    criteria: mergedCriteria,
                    selection: a.getSelection().getValue(),
                });
            } else {
                return this.createQuery({
                    entitySchema,
                    // [todo] hardcoded
                    criteria: this.criteriaTools.or(a.getCriteria(), b.getCriteria()),
                    selection: a.getSelection().getValue(),
                    options,
                });
            }
        }

        return false;
    }

    subtractQueries(queriesA: IEntityQuery[], queriesB: IEntityQuery[]): IEntityQuery[] | false {
        if (!queriesA.length && !queriesB.length) {
            return [];
        }

        let totalSubtracted = queriesA.slice();
        let didSubtract = false;

        // for each query in B, pick each query in A and try to subtract it by B.
        // queries in A are updated with the subtracted results as we go.
        for (const queryB of queriesB) {
            const nextSubtracted: IEntityQuery[] = [];

            for (const queryA of totalSubtracted) {
                const subtracted = this.subtractQuery(this, queryA, queryB);

                if (subtracted) {
                    nextSubtracted.push(...subtracted);
                    didSubtract = true;
                } else {
                    nextSubtracted.push(queryA);
                }
            }

            totalSubtracted = nextSubtracted;
        }

        return didSubtract ? totalSubtracted : false;
    }

    // [todo] shouldn't be able to reduce queries w/ different entity-schemas
    // [todo] it is still unexpected for me that this method returns an empty array on full subtraction,
    // but Criterion.reduce() would return true. should make it consistent.
    subtractQuery(factory: IEntityQueryTools, a: IEntityQuery, b: IEntityQuery): IEntityQuery[] | false {
        const subtracted = this.subtractParts(a, b);

        if (!subtracted) {
            return false;
        } else if (Object.values(subtracted).every(reduced => reduced === true)) {
            return [];
        }

        const subtractedQueries: IEntityQuery[] = [];
        const accumulated: EntityQueryCreate = {
            entitySchema: a.getEntitySchema(),
            criteria: a.getCriteria(),
            selection: a.getSelection(),
            options: a.getOptions(),
            paging: a.getPaging(),
        };

        if (subtracted.paging !== true) {
            subtracted.paging.forEach(paging => {
                subtractedQueries.push(factory.createQuery({ ...accumulated, paging }));
            });

            accumulated.paging = b.getPaging();
        }

        if (subtracted.options !== true) {
            subtractedQueries.push(factory.createQuery({ ...accumulated, options: subtracted.options }));
            accumulated.options = b.getOptions();
        }

        if (subtracted.criteria !== true) {
            subtractedQueries.push(factory.createQuery({ ...accumulated, criteria: subtracted.criteria }));
            // [todo] should we also do intersection for paging & options?
            const intersection = a.getCriteria().intersect(b.getCriteria());

            if (intersection === false) {
                throw new Error("invalid criterion implementation");
            } else {
                accumulated.criteria = intersection;
            }
        }

        if (subtracted.selection !== true) {
            subtractedQueries.push(factory.createQuery({ ...accumulated, selection: subtracted.selection }));
        }

        return subtractedQueries;
    }

    private subtractParts(a: IEntityQuery, b: IEntityQuery): false | SubtractedParts {
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

    parseQuery(input: string, schemas: EntitySchemaCatalog): IEntityQuery {
        return parseQuery(this, this.criteriaTools, input, schemas);
    }
}
