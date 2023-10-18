import { filter, from, map, merge, mergeMap, Observable, of, shareReplay, startWith, takeLast } from "rxjs";
import { Entity } from "../../common/entity.type";
import { UnpackedEntitySelection } from "../../common/unpacked-entity-selection.type";
import { EntityCriteriaTools } from "../../criteria/entity-criteria-tools";
import { EntitySet } from "../../entity/entity-set";
import { InMemoryEntityDatabase } from "../in-memory-entity-database";
import { EntityQueryTools } from "../../query/entity-query-tools";
import { IEntityQuery } from "../../query/entity-query.interface";
import { EntitySelection } from "../../query/entity-selection";
import { IEntitySchema } from "../../schema/schema.interface";
import { EntityServiceContainer } from "../entity-service-container";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

export type EntityHydrationResult<T extends Entity = Entity> = Promise<T[]> | T[] | Observable<T[]>;

export interface EntityHydrationProposal {
    requiredSelection: EntitySelection;
    hydratedSelection: EntitySelection;
    rejectedQuery: IEntityQuery;
    endpoint: EntityHydrationEndpoint;
}

export interface EntityHydrationEndpoint<T extends Entity = Entity> {
    schema: IEntitySchema<T>;
    requires: UnpackedEntitySelection<T>;
    hydrates: UnpackedEntitySelection<T>;
    load(entities: T[], selection: UnpackedEntitySelection<T>): EntityHydrationResult<T>;
}

export class EntityHydrator implements IEntityStreamInterceptor {
    constructor(private readonly services: EntityServiceContainer) {}

    private readonly criteriaTools = new EntityCriteriaTools();
    private readonly queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    hydrationEndpoints: EntityHydrationEndpoint[] = [];

    getName(): string {
        return EntityHydrator.name;
    }

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        if (!this.hydrationEndpoints.length) {
            return stream;
        }

        let mergedDelivered: IEntityQuery[] = [];
        let openProposals: EntityHydrationProposal[] = [];

        const hydrate = (stream: EntityStream): EntityStream => {
            return stream.pipe(
                filter(packet => packet.hasRejected() || packet.hasDelivered()),
                mergeMap(packet => {
                    let rejected = packet.getRejectedQueries();

                    if (rejected.length) {
                        const [newProposals, openRejected] = this.toProposals(
                            this.hydrationEndpoints,
                            packet.getRejectedQueries()
                        );

                        openProposals.push(...newProposals);
                        rejected = openRejected;
                    }

                    if (packet.hasDelivered()) {
                        mergedDelivered = this.queryTools.mergeQueries(
                            ...mergedDelivered,
                            ...packet.getDeliveredQueries()
                        );
                    }

                    const [nextProposals, streams] = this.drainProposals(
                        openProposals,
                        mergedDelivered,
                        this.services.getDatabase()
                    );

                    openProposals = nextProposals;

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
            hydrate(stream)
        );
    }

    private toProposals(
        endpoints: EntityHydrationEndpoint[],
        rejected: IEntityQuery[]
    ): [EntityHydrationProposal[], IEntityQuery[]] {
        const nextRejected: IEntityQuery[] = [];
        const proposals: EntityHydrationProposal[] = [];

        for (const rejectedQuery of rejected) {
            let open = rejectedQuery;

            for (const hydrationEndpoint of endpoints) {
                const hydrationProposal = this.proposeHydration(open, hydrationEndpoint);

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

    private proposeHydration(open: IEntityQuery, endpoint: EntityHydrationEndpoint): false | EntityHydrationProposal {
        const supportedSelection = new EntitySelection({
            schema: endpoint.schema,
            value: endpoint.hydrates,
        });

        const intersection = open.getSelection().intersect(supportedSelection);

        if (!intersection) {
            return false;
        }

        const requiredSelectionValue = endpoint.requires;

        return {
            endpoint,
            hydratedSelection: intersection,
            requiredSelection: new EntitySelection({
                schema: endpoint.schema,
                value: requiredSelectionValue,
            }),
            rejectedQuery: open,
        };
    }

    private drainProposals(
        proposals: EntityHydrationProposal[],
        deliveredQueries: IEntityQuery[],
        cache: InMemoryEntityDatabase
    ): [EntityHydrationProposal[], EntityStream[]] {
        let nextProposals: EntityHydrationProposal[] = proposals.slice();
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
                            proposal.endpoint.load(entities.getEntities(), proposal.hydratedSelection.getValue()),
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
        result: EntityHydrationResult,
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
