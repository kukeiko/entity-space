import { filter, from, map, merge, mergeMap, Observable, of, startWith, takeLast, tap } from "rxjs";
import { Entity } from "../../lib/common/entity.type";
import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { EntitySet } from "../../lib/entity/data-structures/entity-set";
import { InMemoryEntityDatabase } from "../../lib/entity/in-memory-entity-database";
import { EntityStream } from "../../lib/execution/entity-stream";
import { EntityStreamPacket } from "../../lib/execution/entity-stream-packet";
import { IEntityStreamInterceptor } from "../../lib/execution/interceptors/entity-stream-interceptor.interface";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { IEntityQuery } from "../../lib/query/entity-query.interface";
import { EntitySelection } from "../../lib/query/entity-selection";

export type HydrationResult = Promise<Entity[]> | Entity[] | Observable<Entity[]>;

export interface EntityHydrationProposal {
    requiredSelection: EntitySelection;
    hydratedSelection: EntitySelection;
    rejectedQuery: IEntityQuery;
    endpoint: IEntityHydrationEndpoint;
}

export interface IEntityHydrationEndpoint {
    load(entities: EntitySet, selection: EntitySelection): HydrationResult;
    proposeHydration(rejectedSelection: IEntityQuery): false | EntityHydrationProposal;
}

export class EntityHydratorApi implements IEntityStreamInterceptor {
    private readonly criteriaTools = new EntityCriteriaTools();
    private readonly queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    hydrationEndpoints: IEntityHydrationEndpoint[] = [];

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        const cache = new InMemoryEntityDatabase();
        let delivered: IEntityQuery[] = [];
        let proposals: EntityHydrationProposal[] = [];

        return merge(
            stream.pipe(
                map(packet => packet.withoutRejected()),
                filter(packet => !packet.isEmpty())
            ),
            stream.pipe(
                filter(packet => packet.hasPayload()),
                tap(packet => {
                    packet.getPayload().forEach(payload => cache.upsertSync(payload));
                })
            ),
            stream.pipe(
                filter(packet => packet.hasRejected() || packet.hasDelivered()),
                mergeMap(packet => {
                    let rejected = packet.getRejectedQueries();

                    if (rejected.length) {
                        const [newProposals, openRejected] = this.toProposals(
                            this.hydrationEndpoints,
                            packet.getRejectedQueries()
                        );

                        proposals.push(...newProposals);
                        rejected = openRejected;
                    }

                    if (packet.hasDelivered()) {
                        delivered = this.queryTools.mergeQueries(...delivered, ...packet.getDeliveredQueries());
                    }

                    const [nextProposals, streams] = this.drainProposals(proposals, delivered, cache);
                    proposals = nextProposals;

                    if (rejected.length) {
                        streams.push(of(new EntityStreamPacket({ rejected })));
                    }

                    return merge(...streams);
                })
            )
        );
    }

    private toProposals(
        endpoints: IEntityHydrationEndpoint[],
        rejected: IEntityQuery[]
    ): [EntityHydrationProposal[], IEntityQuery[]] {
        const nextRejected: IEntityQuery[] = [];
        const proposals: EntityHydrationProposal[] = [];

        for (const rejectedQuery of rejected) {
            let open = rejectedQuery;

            for (const hydrationEndpoint of endpoints) {
                const hydrationProposal = hydrationEndpoint.proposeHydration(open);

                if (!hydrationProposal) {
                    continue;
                }

                proposals.push(hydrationProposal);
                let next = hydrationProposal.hydratedSelection.subtractFrom(open.getSelection());

                if (next === true) {
                    open = rejectedQuery.withSelection({});
                    break;
                } else if (next) {
                    open = rejectedQuery.withSelection(next);
                }
            }

            if (!open.getSelection().isEmpty()) {
                nextRejected.push(open);
            }
        }

        return [proposals, nextRejected];
    }

    private drainProposals(
        proposals: EntityHydrationProposal[],
        deliveredQueries: IEntityQuery[],
        cache: InMemoryEntityDatabase
    ): [EntityHydrationProposal[], EntityStream[]] {
        const nextProposals: EntityHydrationProposal[] = [];
        const streams: EntityStream[] = [];

        for (const proposal of proposals) {
            for (const deliveredQuery of deliveredQueries) {
                if (proposal.requiredSelection.isSubsetOf(deliveredQuery.getSelection())) {
                    const entitySetToHydrateQuery = deliveredQuery.intersectCriteriaOmitSelection(
                        proposal.rejectedQuery
                    );

                    if (!entitySetToHydrateQuery) {
                        nextProposals.push(proposal);
                        continue;
                    }

                    // the criteria that are possibly "left over" and still need to be hydrated
                    const rejectedCriteriaMinusHydratedCriteria = entitySetToHydrateQuery
                        .getCriteria()
                        .subtractFrom(proposal.rejectedQuery.getCriteria());

                    if (rejectedCriteriaMinusHydratedCriteria === false) {
                        throw new Error("invalid query subtraction implementation");
                    } else if (rejectedCriteriaMinusHydratedCriteria !== true) {
                        nextProposals.push({
                            ...proposal,
                            rejectedQuery: proposal.rejectedQuery.withCriteria(rejectedCriteriaMinusHydratedCriteria),
                        });
                    }

                    const entities = cache.querySync(entitySetToHydrateQuery);
                    const acceptedQuery = entitySetToHydrateQuery.withSelection(proposal.hydratedSelection);

                    streams.push(
                        this.loadedToEntityStream(
                            proposal.endpoint.load(entities, proposal.hydratedSelection),
                            entitySetToHydrateQuery,
                            proposal.hydratedSelection
                        ).pipe(startWith(new EntityStreamPacket({ accepted: [acceptedQuery] })))
                    );
                }
            }
        }

        return [nextProposals, streams];
    }

    private loadedToEntityStream(
        result: HydrationResult,
        hydratedEntitySetQuery: IEntityQuery,
        hydratedSelection: EntitySelection
    ): EntityStream {
        let stream: Observable<Entity[]>;

        if (result instanceof Promise) {
            stream = from(result);
        } else if (Array.isArray(result)) {
            stream = of(result);
        } else {
            stream = result;
        }

        const deliveredQuery = hydratedEntitySetQuery.withSelection(hydratedSelection);

        return stream.pipe(
            takeLast(1),
            map(entities => {
                return new EntityStreamPacket({
                    delivered: [deliveredQuery],
                    payload: [new EntitySet({ query: deliveredQuery, entities })],
                });
            })
        );
    }
}
