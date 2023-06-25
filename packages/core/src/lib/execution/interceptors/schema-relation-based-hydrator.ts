import { isNotFalse, readPathOnObjects, writePath } from "@entity-space/utils";
import { EMPTY, map, merge, of, switchMap, takeLast, tap } from "rxjs";
import { Entity } from "../../common/entity.type";
import { UnpackedEntitySelection } from "../../common/unpacked-entity-selection.type";
import { EntityCriteriaTools } from "../../criteria/entity-criteria-tools";
import { EntitySet } from "../../entity/data-structures/entity-set";
import { EntityQuery } from "../../query/entity-query";
import { EntityQueryTools } from "../../query/entity-query-tools";
import { IEntityQuery } from "../../query/entity-query.interface";
import { EntitySelection } from "../../query/entity-selection";
import { EntitySelectionTools } from "../../query/entity-selection-tools";
import { EntityQueryTracing } from "../entity-query-tracing";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { runInterceptors } from "../run-interceptors.fn";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

interface HydrateRelationQuery {
    entities: EntitySet;
    relationPath: string[];
    relationQuery: IEntityQuery;
}

export class SchemaRelationBasedHydrator implements IEntityStreamInterceptor {
    constructor(
        private readonly tracing: EntityQueryTracing,
        private readonly interceptors: IEntityStreamInterceptor[]
    ) {}

    private readonly criteriaTools = new EntityCriteriaTools();
    private readonly queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });
    private readonly selectionTools = new EntitySelectionTools();

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
                // [todo] need to get rid of takeLast()
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

                            const clipped = this.selectionTools.clip(
                                rejectedQuery.getSelection().getValue(),
                                entitySetToHydrate.getQuery().getSelection().getValue()
                            );

                            const targets = clipped
                                .map(([relationPath, selectionValue]) =>
                                    this.toHydrateRelationQuery(entitySetToHydrate, relationPath, selectionValue)
                                )
                                .filter(isNotFalse);

                            targets.forEach(({ relationQuery }) =>
                                this.tracing.querySpawned(relationQuery, "💧 hydration")
                            );

                            if (!targets.length) {
                                continue;
                            }

                            hydrationStreams.push(
                                ...targets.map(hydrationQuery => {
                                    return this.startRelationHydration(hydrationQuery);
                                })
                            );
                        }
                    }

                    if (!hydrationStreams.length) {
                        if (rejected.length) {
                            return of(new EntityStreamPacket({ rejected }));
                        } else {
                            return EMPTY;
                        }
                    }

                    return merge(...hydrationStreams);
                })
            )
        );
    }

    private toHydrateRelationQuery(
        entitySet: EntitySet,
        relationPath: string[],
        selectionValue?: UnpackedEntitySelection | true
    ): false | HydrateRelationQuery {
        if (selectionValue === void 0 || selectionValue === true) {
            return false;
        }

        const relation = entitySet.getQuery().getEntitySchema().findRelationDeep(relationPath);

        if (relation === void 0) {
            return false;
        }

        const relatedSchema = relation.getRelatedEntitySchema();
        const entities = readPathOnObjects<Entity[]>(relationPath.slice(0, -1), entitySet.getEntities());

        const criteria = this.criteriaTools.createCriterionFromEntities(
            entities,
            relation.getFromIndex().getPaths(),
            relation.getToIndex().getPaths()
        );

        const query = this.queryTools.createQuery({
            entitySchema: relatedSchema,
            criteria,
            selection: selectionValue,
        });

        return {
            entities: entitySet,
            relationPath,
            relationQuery: query,
        };
    }

    private startRelationHydration(hydrationQuery: HydrateRelationQuery): EntityStream {
        const relationQuery = hydrationQuery.relationQuery;
        const accepted: IEntityQuery[] = [];
        const payloads: EntitySet[] = [];

        return runInterceptors(this.interceptors, [relationQuery]).pipe(
            tap(packet => {
                accepted.push(...packet.getAcceptedQueries());
                payloads.push(...packet.getPayload());
            }),
            // [todo] takeLast(1) should be removed as we might tap into streams that never complete
            takeLast(1),
            map(() => {
                // [todo] see if any deeper expansions have been rejected
                // [update] is this comment still relevant?
                const rejected = this.queryTools.subtractQueries([relationQuery], accepted) || [relationQuery];

                const [finalAccepted, finalRejected] = this.toMappedAcceptedAndRejectedQueries({
                    accepted,
                    rejected,
                    hydrationQuery,
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
    }: {
        accepted: IEntityQuery[];
        rejected: IEntityQuery[];
        hydrationQuery: HydrateRelationQuery;
    }): [IEntityQuery[], IEntityQuery[]] {
        const relationPath = hydrationQuery.relationPath.join(".");
        const hydratedEntitiesQuery = hydrationQuery.entities.getQuery();
        const relationQuery = hydrationQuery.relationQuery;

        // [todo] #208 should not check for equivalency, but instead if accepted criteria are a superset
        if (EntityQuery.equivalentCriteria(relationQuery, ...this.queryTools.mergeQueries(...accepted))) {
            if (rejected.length && accepted.length) {
                return [
                    [
                        hydratedEntitiesQuery.withSelection(
                            writePath(
                                relationPath,
                                {},
                                EntitySelection.mergeValues(...accepted.map(q => q.getSelection().getValue()))
                            )
                        ),
                    ],
                    [
                        hydratedEntitiesQuery.withSelection(
                            writePath(
                                relationPath,
                                {},
                                EntitySelection.mergeValues(...rejected.map(q => q.getSelection().getValue()))
                            )
                        ),
                    ],
                ];
            } else if (accepted.length) {
                return [
                    [
                        hydratedEntitiesQuery.withSelection(
                            new EntitySelection({
                                schema: hydratedEntitiesQuery.getEntitySchema(),
                                value: writePath(relationPath, {}, relationQuery.getSelection().getValue()),
                            })
                        ),
                    ],
                    [],
                ];
            } else if (rejected.length) {
                return [
                    [],
                    [
                        hydratedEntitiesQuery.withSelection(
                            new EntitySelection({
                                schema: hydratedEntitiesQuery.getEntitySchema(),
                                value: writePath(relationPath, {}, relationQuery.getSelection().getValue()),
                            })
                        ),
                    ],
                ];
            } else {
                return [[], []];
            }
        } else {
            return [
                accepted.map(acceptedQuery =>
                    hydratedEntitiesQuery
                        .withCriteria(
                            this.criteriaTools.and(
                                hydratedEntitiesQuery.getCriteria(),
                                this.criteriaTools.where(writePath(relationPath, {}, acceptedQuery.getCriteria()))
                            )
                        )
                        .withSelection(writePath(relationPath, {}, acceptedQuery.getSelection().getValue()))
                ),
                rejected.map(rejectedQuery =>
                    hydratedEntitiesQuery
                        .withCriteria(
                            this.criteriaTools.and(
                                hydratedEntitiesQuery.getCriteria(),
                                this.criteriaTools.where(writePath(relationPath, {}, rejectedQuery.getCriteria()))
                            )
                        )
                        .withSelection(writePath(relationPath, {}, rejectedQuery.getSelection().getValue()))
                ),
            ];
        }
    }
}
