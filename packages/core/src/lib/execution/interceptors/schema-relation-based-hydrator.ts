import { isNotFalse, writePath } from "@entity-space/utils";
import { map, merge, of, switchMap, takeLast, tap } from "rxjs";
import { IEntitySchemaRelation } from "../../schema/schema.interface";
import { UnpackedEntitySelection } from "../../common/unpacked-entity-selection.type";
import { EntitySet } from "../../entity/data-structures/entity-set";
import { createCriterionFromEntities } from "../../entity/functions/create-criterion-from-entities.fn";
import { EntitySelection } from "../../query/entity-selection";
import { mergeQueries } from "../../query/merge-queries.fn";
import { subtractQueries } from "../../query/subtract-queries.fn";
import { EntityQueryTracing } from "../entity-query-tracing";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { IEntityStreamInterceptor } from "../i-entity-stream-interceptor";
import { runInterceptors } from "../run-interceptors.fn";
import { IEntityQuery } from "../../query/entity-query.interface";
import { EntityQueryFactory } from "../../query/entity-query-factory";
import { EntityCriteriaFactory } from "../../criteria/vnext/entity-criteria-factory";
import { EntityQuery } from "../../query/entity-query";

export class SchemaRelationBasedHydrator implements IEntityStreamInterceptor {
    constructor(
        private readonly tracing: EntityQueryTracing,
        private readonly interceptors: IEntityStreamInterceptor[]
    ) {}

    intercept(stream: EntityStream): EntityStream {
        const rejected: IEntityQuery[] = [];
        const payloads: EntitySet[] = [];

        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected)),
            stream.pipe(
                tap(packet => {
                    rejected.push(...packet.getRejectedQueries());
                    payloads.push(...packet.getPayload());
                }),
                takeLast(1),
                switchMap(() => {
                    const hydrationStreams: EntityStream[] = [];

                    // [todo] move to method & use [].reduce()
                    for (const entitySet of payloads) {
                        for (const rejectedQuery of rejected) {
                            const entitySetToHydrateQuery = entitySet
                                .getQuery()
                                .intersectCriteriaOmitSelection(rejectedQuery);

                            if (!entitySetToHydrateQuery) {
                                continue;
                            }

                            const entitiesToHydrate = entitySetToHydrateQuery
                                .getCriteria()
                                .filter(entitySet.getEntities());

                            if (!entitiesToHydrate.length) {
                                continue;
                            }

                            const entitySetToHydrate = new EntitySet({
                                query: entitySetToHydrateQuery,
                                entities: entitiesToHydrate,
                            });

                            const targets = Object.entries(rejectedQuery.getSelection().getValue())
                                .map(([key, value]) => this.toHydrateRelationQuery(entitySetToHydrate, key, value))
                                .filter(isNotFalse);

                            targets.forEach(([query]) => this.tracing.querySpawned(query));

                            if (!targets.length) {
                                continue;
                            }

                            hydrationStreams.push(
                                ...targets.map(([target, relation]) => {
                                    return this.startRelationHydration(entitySetToHydrate.getQuery(), target, relation);
                                })
                            );
                        }
                    }

                    if (!hydrationStreams.length) {
                        return of(new EntityStreamPacket({ rejected }));
                    }

                    return merge(...hydrationStreams);
                })
            )
        );
    }

    private toHydrateRelationQuery(
        entitySet: EntitySet,
        key: string,
        selectionValue?: UnpackedEntitySelection | true
    ): false | [IEntityQuery, IEntitySchemaRelation] {
        if (selectionValue === void 0 || selectionValue === true) {
            return false;
        }

        const relation = entitySet.getQuery().getEntitySchema().findRelation(key);

        if (relation === void 0) {
            return false;
        }

        const relatedSchema = relation.getRelatedEntitySchema();

        const criteria = createCriterionFromEntities(
            entitySet.getEntities(),
            relation.getFromIndex().getPath(),
            relation.getToIndex().getPath()
        );

        const query = new EntityQueryFactory({ criteriaFactory: new EntityCriteriaFactory() }).createQuery({
            entitySchema: relatedSchema,
            criteria,
            selection: selectionValue,
        });

        return [query, relation];
    }

    private startRelationHydration(
        hydrationQuery: IEntityQuery,
        relationQuery: IEntityQuery,
        relation: IEntitySchemaRelation
    ): EntityStream {
        this.tracing.queryStartedExecution(relationQuery);

        const accepted: IEntityQuery[] = [];
        const payloads: EntitySet[] = [];

        return runInterceptors(this.interceptors, [relationQuery]).pipe(
            tap(packet => {
                accepted.push(...packet.getAcceptedQueries());
                payloads.push(...packet.getPayload());
            }),
            takeLast(1),
            map(() => {
                // [todo] see if any deeper expansions have been rejected
                // [update] is this comment still relevant?
                const rejected = subtractQueries([relationQuery], accepted) || [relationQuery];

                const [finalAccepted, finalRejected] = this.toMappedAcceptedAndRejectedQueries({
                    accepted,
                    hydrationQuery,
                    rejected,
                    relation,
                    relationQuery,
                });

                return new EntityStreamPacket({
                    accepted: finalAccepted,
                    rejected: finalRejected,
                    payload: payloads,
                });
            }),
            tap(packet => this.tracing.queryReceivedPacket(relationQuery, packet))
        );
    }

    // [todo] simplify this mess
    private toMappedAcceptedAndRejectedQueries({
        accepted,
        rejected,
        hydrationQuery,
        relationQuery,
        relation,
    }: {
        accepted: IEntityQuery[];
        rejected: IEntityQuery[];
        hydrationQuery: IEntityQuery;
        relationQuery: IEntityQuery;
        relation: IEntitySchemaRelation;
    }): [IEntityQuery[], IEntityQuery[]] {
        // [todo] should not check for equivalency, but instead if accepted criteria are a superset
        if (EntityQuery.equivalentCriteria(relationQuery, ...mergeQueries(...accepted))) {
            if (rejected.length && accepted.length) {
                return [
                    [
                        hydrationQuery.withSelection(
                            writePath(
                                relation.getPropertyName(),
                                {},
                                EntitySelection.mergeValues(...accepted.map(q => q.getSelection().getValue()))
                            )
                        ),
                    ],
                    [
                        hydrationQuery.withSelection(
                            writePath(
                                relation.getPropertyName(),
                                {},
                                EntitySelection.mergeValues(...rejected.map(q => q.getSelection().getValue()))
                            )
                        ),
                    ],
                ];
            } else if (accepted.length) {
                return [
                    [
                        hydrationQuery.withSelection(
                            hydrationQuery.getSelection().merge(
                                new EntitySelection({
                                    schema: hydrationQuery.getEntitySchema(),
                                    value: { [relation.getPropertyName()]: relationQuery.getSelection().getValue() },
                                })
                            )
                        ),
                    ],
                    [],
                ];
            } else if (rejected.length) {
                return [
                    [],
                    [
                        hydrationQuery.withSelection(
                            hydrationQuery.getSelection().merge(
                                new EntitySelection({
                                    schema: hydrationQuery.getEntitySchema(),
                                    value: { [relation.getPropertyName()]: relationQuery.getSelection().getValue() },
                                })
                            )
                        ),
                    ],
                ];
            } else {
                return [[], []];
            }
        } else {
            const factory = new EntityCriteriaFactory();

            return [
                accepted.map(acceptedQuery =>
                    hydrationQuery
                        .withCriteria(
                            factory.and(
                                hydrationQuery.getCriteria(),
                                factory.where({ [relation.getPropertyName()]: acceptedQuery.getCriteria() })
                            )
                        )
                        .withSelection(
                            writePath(relation.getPropertyName(), {}, acceptedQuery.getSelection().getValue())
                        )
                ),
                rejected.map(rejectedQuery =>
                    hydrationQuery
                        .withCriteria(
                            factory.and(
                                hydrationQuery.getCriteria(),
                                factory.where({ [relation.getPropertyName()]: rejectedQuery.getCriteria() })
                            )
                        )
                        .withSelection(
                            writePath(relation.getPropertyName(), {}, rejectedQuery.getSelection().getValue())
                        )
                ),
            ];
        }
    }
}
