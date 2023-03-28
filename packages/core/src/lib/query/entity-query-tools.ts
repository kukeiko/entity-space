import { isEqual } from "lodash";
import { Entity } from "../common/entity.type";
import { ICriterion } from "../criteria/criterion.interface";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQuery } from "./entity-query";
import { EntityQueryCreate, IEntityQueryTools } from "./entity-query-tools.interface";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";
import { parseQuery } from "./parse-query.fn";

type SubtractedParts = {
    criteria: true | ICriterion;
    selection: true | EntitySelection;
    parameters: true;
};

export class EntityQueryTools implements IEntityQueryTools {
    constructor({ criteriaTools }: { criteriaTools: IEntityCriteriaTools }) {
        this.criteriaTools = criteriaTools;
    }

    private readonly criteriaTools: IEntityCriteriaTools;

    createQuery = (args: EntityQueryCreate): IEntityQuery => {
        let { entitySchema, criteria, paging, selection, parameters } = args;

        return new EntityQuery({
            queryTools: this,
            entitySchema,
            criteria: criteria ?? this.criteriaTools.all(),
            paging,
            parameters,
            selection:
                selection === void 0
                    ? new EntitySelection({ schema: entitySchema, value: entitySchema.getDefaultSelection() })
                    : selection instanceof EntitySelection
                    ? selection
                    : new EntitySelection({ schema: entitySchema, value: selection }),
        });
    };

    createIdQueryFromEntities = (schema: IEntitySchema, entities: Entity[]): IEntityQuery => {
        const indexCriteria = this.criteriaTools.createCriterionFromEntities(entities, schema.getKey().getPath());

        return this.createQuery({
            entitySchema: schema,
            criteria: indexCriteria,
        });
    };

    createQueriesFromEntities = (schema: IEntitySchema, entities: Entity[]): IEntityQuery[] => {
        const queries: IEntityQuery[] = [];

        // [todo] also implement other indexes
        if (schema.hasKey()) {
            queries.push(this.createIdQueryFromEntities(schema, entities));
        }

        return queries;
    };

    mergeQueries = (...queries: IEntityQuery[]): IEntityQuery[] => {
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
    };

    // [todo] clean up this method, it is really hard to read and hacked together.
    mergeQuery = (a: IEntityQuery, b: IEntityQuery): false | IEntityQuery => {
        if (a.getEntitySchema().getId() !== b.getEntitySchema().getId()) {
            return false;
        }

        if (!isEqual(a.getParameters(), b.getParameters())) {
            return false;
        }

        const equivalentCriteria = a.getCriteria().equivalent(b.getCriteria());
        const equivalentSelection = a.getSelection().equivalent(b.getSelection());
        const entitySchema = a.getEntitySchema();

        if (equivalentCriteria) {
            // same identity, just merge expansions
            return this.createQuery({
                entitySchema,
                criteria: a.getCriteria(),
                selection: EntitySelection.mergeValues(a.getSelection().getValue(), b.getSelection().getValue()),
                parameters: a.getParameters(),
            });
        }

        const mergedCriteria = a.getCriteria().merge(b.getCriteria());

        if (equivalentSelection) {
            if (mergedCriteria !== false) {
                return this.createQuery({
                    entitySchema,
                    criteria: mergedCriteria,
                    selection: a.getSelection().getValue(),
                    parameters: a.getParameters(),
                });
            } else {
                return this.createQuery({
                    entitySchema,
                    // [todo] hardcoded
                    criteria: this.criteriaTools.or(a.getCriteria(), b.getCriteria()),
                    selection: a.getSelection().getValue(),
                    parameters: a.getParameters(),
                });
            }
        }

        return false;
    };

    subtractQueries = (queriesA: IEntityQuery[], queriesB: IEntityQuery[]): IEntityQuery[] | false => {
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
    };

    // [todo] shouldn't be able to reduce queries w/ different entity-schemas
    // [todo] it is still unexpected for me that this method returns an empty array on full subtraction,
    // but Criterion.reduce() would return true. should make it consistent.
    subtractQuery = (factory: IEntityQueryTools, a: IEntityQuery, b: IEntityQuery): IEntityQuery[] | false => {
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
            parameters: a.getParameters(),
        };

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
    };

    private subtractParts(a: IEntityQuery, b: IEntityQuery): false | SubtractedParts {
        if (!isEqual(a.getParameters(), b.getParameters())) {
            return false;
        }

        const criteria = b.getCriteria().subtractFrom(a.getCriteria());

        if (!criteria) {
            return false;
        }

        const selection = b.getSelection().subtractFrom(a.getSelection());

        if (!selection) {
            return false;
        }

        return { criteria, selection, parameters: true };
    }

    parseQuery = (input: string, schemas: EntitySchemaCatalog): IEntityQuery => {
        return parseQuery(this, this.criteriaTools, input, schemas);
    };
}
