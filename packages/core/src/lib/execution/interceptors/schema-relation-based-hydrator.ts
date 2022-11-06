import { ExpansionValue, IEntitySchemaRelation } from "@entity-space/common";
import { and, fromDeepBag } from "@entity-space/criteria";
import { isNotFalse, writePath } from "@entity-space/utils";
import { map, merge, of, switchMap, takeLast, tap } from "rxjs";
import { EntitySet } from "../../entity/data-structures/entity-set";
import { createCriterionFromEntities } from "../../entity/functions/create-criterion-from-entities.fn";
import { Expansion } from "../../expansion/expansion";
import { EntityQuery } from "../../query/entity-query";
import { mergeQueries } from "../../query/merge-queries.fn";
import { reduceQueries } from "../../query/reduce-queries.fn";
import { EntityQueryTracing } from "../../tracing/entity-query-tracing";
import { IEntityStreamInterceptor } from "../i-entity-stream-interceptor";
import { QueryStream } from "../query-stream";
import { QueryStreamPacket } from "../query-stream-packet";
import { runInterceptors } from "../run-interceptors.fn";

export class SchemaRelationBasedHydrator implements IEntityStreamInterceptor {
    constructor(
        private readonly tracing: EntityQueryTracing,
        private readonly interceptors: IEntityStreamInterceptor[]
    ) {}

    intercept(stream: QueryStream): QueryStream {
        const rejected: EntityQuery[] = [];
        const payloads: EntitySet[] = [];

        return merge(
            stream.pipe(map(QueryStreamPacket.withoutRejected)),
            stream.pipe(
                tap(packet => {
                    rejected.push(...packet.getRejectedQueries());
                    payloads.push(...packet.getPayload());
                }),
                takeLast(1),
                switchMap(() => {
                    const hydrationStreams: QueryStream[] = [];

                    // [todo] move to method & use [].reduce()
                    for (const entitySet of payloads) {
                        for (const rejectedQuery of rejected) {
                            const entitySetToHydrateQuery = entitySet
                                .getQuery()
                                .intersectCriteriaOmitExpansion(rejectedQuery);

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

                            const targets = Object.entries(rejectedQuery.getExpansionValue())
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
                        return of(new QueryStreamPacket({ rejected }));
                    }

                    return merge(...hydrationStreams);
                })
            )
        );
    }

    private toHydrateRelationQuery(
        entitySet: EntitySet,
        key: string,
        expansionValue: ExpansionValue
    ): false | [EntityQuery, IEntitySchemaRelation] {
        if (expansionValue === void 0) {
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

        const relatedExpansion = expansionValue === true ? relatedSchema.getDefaultExpansion() : expansionValue;
        const query = new EntityQuery({ entitySchema: relatedSchema, criteria, expansion: relatedExpansion });

        return [query, relation];
    }

    private startRelationHydration(
        hydrationQuery: EntityQuery,
        relationQuery: EntityQuery,
        relation: IEntitySchemaRelation
    ): QueryStream {
        this.tracing.queryStartedExecution(relationQuery);

        const accepted: EntityQuery[] = [];
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
                const rejected = reduceQueries([relationQuery], accepted) || [relationQuery];

                const [finalAccepted, finalRejected] = this.toMappedAcceptedAndRejectedQueries({
                    accepted,
                    hydrationQuery,
                    rejected,
                    relation,
                    relationQuery,
                });

                console.log(
                    "🌵",
                    finalAccepted.map(q => q.toString())
                );

                console.log(
                    "🎃",
                    finalRejected.map(q => q.toString())
                );

                return new QueryStreamPacket({
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
        accepted: EntityQuery[];
        rejected: EntityQuery[];
        hydrationQuery: EntityQuery;
        relationQuery: EntityQuery;
        relation: IEntitySchemaRelation;
    }): [EntityQuery[], EntityQuery[]] {
        // [todo] should not check for equivalency, but instead if accepted criteria are a superset
        if (EntityQuery.equivalentCriteria(relationQuery, ...mergeQueries(...accepted))) {
            if (rejected.length && accepted.length) {
                return [
                    [
                        hydrationQuery.withExpansion(
                            writePath(
                                relation.getPropertyName(),
                                {},
                                Expansion.mergeValues(
                                    hydrationQuery.getEntitySchema(),
                                    ...accepted.map(q => q.getExpansionValue())
                                )
                            )
                        ),
                    ],
                    [
                        hydrationQuery.withExpansion(
                            writePath(
                                relation.getPropertyName(),
                                {},
                                Expansion.mergeValues(
                                    hydrationQuery.getEntitySchema(),
                                    ...rejected.map(q => q.getExpansionValue())
                                )
                            )
                        ),
                    ],
                ];
            } else if (accepted.length) {
                return [
                    [
                        hydrationQuery.withExpansion(
                            hydrationQuery.getExpansion().merge(
                                new Expansion({
                                    schema: hydrationQuery.getEntitySchema(),
                                    value: { [relation.getPropertyName()]: relationQuery.getExpansionValue() },
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
                        hydrationQuery.withExpansion(
                            hydrationQuery.getExpansion().merge(
                                new Expansion({
                                    schema: hydrationQuery.getEntitySchema(),
                                    value: { [relation.getPropertyName()]: relationQuery.getExpansionValue() },
                                })
                            )
                        ),
                    ],
                ];
            } else {
                return [[], []];
            }
        } else {
            return [
                accepted.map(acceptedQuery =>
                    hydrationQuery

                        .withCriteria(
                            and(
                                hydrationQuery.getCriteria(),
                                fromDeepBag({ [relation.getPropertyName()]: acceptedQuery.getCriteria() })
                            )
                        )
                        .withExpansion(writePath(relation.getPropertyName(), {}, acceptedQuery.getExpansionValue()))
                ),
                rejected.map(rejectedQuery =>
                    hydrationQuery

                        .withCriteria(
                            and(
                                hydrationQuery.getCriteria(),
                                fromDeepBag({ [relation.getPropertyName()]: rejectedQuery.getCriteria() })
                            )
                        )
                        .withExpansion(writePath(relation.getPropertyName(), {}, rejectedQuery.getExpansionValue()))
                ),
            ];
        }
    }
}
