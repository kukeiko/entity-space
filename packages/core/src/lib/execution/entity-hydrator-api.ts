import { filter, from, map, merge, mergeMap, Observable, of, shareReplay, startWith, takeLast, tap } from "rxjs";
import { Entity } from "../common/entity.type";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { EntitySet } from "../entity/data-structures/entity-set";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySelection } from "../query/entity-selection";

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

        const hydrate = (stream: EntityStream): EntityStream => {
            return stream.pipe(
                tap(packet => {
                    if (packet.hasPayload()) {
                        packet.getPayload().forEach(payload => cache.upsertSync(payload));
                    }
                }),
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

                    if (streams.length) {
                        streams.push(...streams.map(stream => hydrate(stream)));
                    }

                    if (rejected.length) {
                        streams.push(of(new EntityStreamPacket({ rejected })));
                    }

                    return merge(...streams);
                })
            );
        };
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
            hydrate(stream)
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
        let nextProposals: EntityHydrationProposal[] = proposals;
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

                    // the criteria identifying the entities that are possibly "left over" and still need to be hydrated
                    const rejectedCriteriaMinusHydratedCriteria = entitySetToHydrateQuery
                        .getCriteria()
                        .subtractFrom(proposal.rejectedQuery.getCriteria());

                    if (rejectedCriteriaMinusHydratedCriteria === false) {
                        throw new Error("invalid query subtraction implementation");
                    } else if (rejectedCriteriaMinusHydratedCriteria !== true) {
                        nextProposals = proposals.filter(p => p !== proposal);
                        nextProposals.push({
                            ...proposal,
                            rejectedQuery: proposal.rejectedQuery.withCriteria(rejectedCriteriaMinusHydratedCriteria),
                        });
                    } else {
                        nextProposals = proposals.filter(p => p !== proposal);
                    }

                    const entities = cache.querySync(entitySetToHydrateQuery);
                    const acceptedQuery = entitySetToHydrateQuery.withSelection(proposal.hydratedSelection);

                    streams.push(
                        this.loadedToEntityStream(
                            proposal.endpoint.load(entities, proposal.hydratedSelection),
                            entitySetToHydrateQuery,
                            proposal.hydratedSelection
                        ).pipe(startWith(new EntityStreamPacket({ accepted: [acceptedQuery] })), shareReplay())
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
