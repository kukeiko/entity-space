import { isFalse, isNotFalse } from "@entity-space/utils";
import { flatten } from "lodash";
import { filter, from, isObservable, map, merge, mergeAll, Observable, of, startWith, switchMap, tap } from "rxjs";
import { EntityCriteriaShapeTools } from "../../criteria/entity-criteria-shape-tools";
import { EntityCriteriaTools } from "../../criteria/entity-criteria-tools";
import { WhereEntityTools } from "../../criteria/where-entity/where-entity-tools";
import { EntitySet } from "../../entity/entity-set";
import { EntityQueryShape } from "../../query/entity-query-shape";
import { EntityQueryTools } from "../../query/entity-query-tools";
import { IEntityQuery } from "../../query/entity-query.interface";
import { IEntitySchema } from "../../schema/schema.interface";
import { EntityServiceContainer } from "../entity-service-container";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { EntitySourceEndpoint, EntitySourceEndpointData, EntitySourceEndpointInvoke } from "./entity-source-endpoint";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

export class EntitySource implements IEntityStreamInterceptor {
    constructor(protected readonly services: EntityServiceContainer) {}

    protected endpoints: EntitySourceEndpoint[] = [];
    protected readonly criteriaTools = new EntityCriteriaTools();
    protected readonly queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });
    protected readonly shapeTools = new EntityCriteriaShapeTools({ criteriaTools: this.criteriaTools });
    protected readonly whereEntityTools = new WhereEntityTools(this.shapeTools, this.criteriaTools);

    getName(): string {
        return EntitySource.name;
    }

    addEndpoint(endpoint: EntitySourceEndpoint): this {
        this.endpoints.push(endpoint);
        return this;
    }

    intercept(stream: EntityStream): EntityStream {
        if (!this.endpoints.length) {
            return stream;
        }

        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected), filter(EntityStreamPacket.isNotEmpty)),
            stream.pipe(
                filter(EntityStreamPacket.hasRejected),
                map(packet => {
                    const streams = packet.getRejectedQueries().map(query => {
                        // [todo] we currently only have 1x EntitySchema per 1x EntitySource, making filtering endpoints
                        // by EntitySchema kind of useless.
                        const endpoints = this.getEndpointsAcceptingSchema(query.getEntitySchema());

                        if (!endpoints.length) {
                            return of(new EntityStreamPacket({ rejected: [query] }));
                        }

                        const [delegatedStreams, acceptedQueries] = this.dispatchToEndpoints(query, endpoints);
                        const rejectedQueries = this.queryTools.subtractQueries([query], acceptedQueries);
                        const initialPackets: EntityStreamPacket[] = [];

                        if (!rejectedQueries || rejectedQueries.length) {
                            initialPackets.push(new EntityStreamPacket({ rejected: rejectedQueries || [query] }));
                        }

                        return merge(...initialPackets.map(packet => of(packet)), ...delegatedStreams);
                    });

                    return merge(...streams);
                }),
                mergeAll()
            )
        );
    }

    private dispatchToEndpoints(
        query: IEntityQuery,
        endpoints: EntitySourceEndpoint[]
    ): [EntityStream[], IEntityQuery[]] {
        let open: IEntityQuery[] = [query];
        const delegatedStreams: EntityStream[] = [];
        const acceptedQueries: IEntityQuery[] = [];

        for (const endpoint of endpoints) {
            const dispatched = this.dispatchToEndpoint(endpoint, open);

            if (!dispatched) {
                continue;
            }

            delegatedStreams.push(dispatched[0]);
            acceptedQueries.push(...dispatched[1]);
            open = this.queryTools.subtractQueries(open, dispatched[1]) || open;

            if (!open.length) {
                break;
            }
        }

        return [delegatedStreams, acceptedQueries];
    }

    private dispatchToEndpoint(
        endpoint: EntitySourceEndpoint,
        queries: IEntityQuery[]
    ): false | [Observable<EntityStreamPacket>, IEntityQuery[]] {
        // [todo] move queryShape to endpoint class
        const queryShape = new EntityQueryShape({
            schema: endpoint.getSchema(),
            criterion: endpoint.getCriterionShape(),
            selection: endpoint.getSelection(),
            parameters: endpoint.getParametersShape(),
        });

        const reshapedQueries = flatten(queries.map(query => queryShape.reshape(query)).filter(isNotFalse));

        if (!reshapedQueries) {
            return false;
        }

        const acceptedReshaped = reshapedQueries.filter(query => {
            if (!endpoint.acceptCriterion(query.getCriteria())) {
                return false;
            }

            return true;
        });

        if (!acceptedReshaped.length) {
            return false;
        }

        const results = acceptedReshaped.map(query => this.runQueryAgainstEndpoint(query, endpoint));

        if (results.every(isFalse)) {
            return false;
        }

        const [streams, accepted] = results.reduce(
            (acc, value) => {
                if (value !== false) {
                    acc[0].push(value[0]);
                    acc[1].push(...value[1]);
                }
                return acc;
            },
            [[], []] as [Observable<EntityStreamPacket>[], IEntityQuery[]]
        );

        return [merge(...streams), accepted];
    }

    private runQueryAgainstEndpoint(
        query: IEntityQuery,
        endpoint: EntitySourceEndpoint
    ): false | [Observable<EntityStreamPacket>, IEntityQuery[]] {
        let openQueries = this.services.getDatabase().subtractByCached(query);
        let fromCacheQueries: IEntityQuery[] = [];
        let fromCacheEntities: EntitySet[] = [];
        const initialPackets: EntityStreamPacket[] = [];

        if (openQueries !== false && !openQueries.length) {
            this.services.getTracing().queryWasLoadedFromCache(query);
            return [
                of(
                    new EntityStreamPacket({
                        accepted: [query],
                        delivered: [query],
                        payload: [this.services.getDatabase().querySync(query)],
                    })
                ),
                [],
            ];
        } else if (openQueries !== false && openQueries.length) {
            // [todo] move queryShape to endpoint class
            const queryShape = new EntityQueryShape({
                schema: endpoint.getSchema(),
                criterion: endpoint.getCriterionShape(),
                selection: endpoint.getSelection(),
                parameters: endpoint.getParametersShape(),
            });

            const reshaped = openQueries.map(openQuery => {
                const reshaped = queryShape.reshape(openQuery);

                if (reshaped === false || !reshaped.length) {
                    return false;
                } else {
                    return reshaped;
                }
            });

            if (reshaped.every(isNotFalse)) {
                const merged = this.queryTools.mergeQueries(...flatten(reshaped));
                const reshapedAgain = merged.map(mergedQuery => queryShape.reshape(mergedQuery));

                if (reshapedAgain.every(isNotFalse)) {
                    let fromCacheQueries_ = this.queryTools.subtractQueries([query], openQueries);

                    if (fromCacheQueries_ === false || !fromCacheQueries_.length) {
                        throw new Error(`bad EntityQuery subtraction logic implementation`);
                    }

                    fromCacheEntities = fromCacheQueries.map(query => this.services.getDatabase().querySync(query));
                    fromCacheQueries = fromCacheQueries_;

                    // [todo] "query" argument should actually be the query initially passed to this method,
                    // and then new arguments should exist to describe the actual query loaded from cache (as it could be a subset of the initial query)
                    fromCacheQueries.forEach(query => this.services.getTracing().queryWasLoadedFromCache(query));
                    openQueries = flatten(reshapedAgain);

                    initialPackets.push(
                        new EntityStreamPacket({
                            accepted: fromCacheQueries,
                            delivered: fromCacheQueries,
                            payload: fromCacheEntities,
                        })
                    );
                } else {
                    openQueries = [query];
                }
            } else {
                openQueries = [query];
            }
        } else {
            openQueries = [query];
        }

        const initialPacket = new EntityStreamPacket({ accepted: openQueries });
        const whereEntityShape = endpoint.getWhereEntityShape();

        openQueries.forEach(openQuery =>
            this.services.getTracing().queryDispatchedToEndpoint([query], openQuery, endpoint.getCriterionShape())
        );

        const stream = merge(
            ...openQueries.map(query => {
                const invoked = endpoint.getInvoke()({
                    query,
                    selection: query.getSelection().getValue(),
                    paging: query.getPaging(),
                    parameters: query.getParameters(),
                    criteria: whereEntityShape
                        ? this.whereEntityTools.toWhereEntitySingleFromCriterion(query.getCriteria(), whereEntityShape)
                        : {},
                });

                return this.invokedToDataStream(invoked).pipe(
                    map(data => this.endpointDataToPacket(query, data)),
                    tap(packet => {
                        packet.getPayload().forEach(payload => this.services.getDatabase().upsertSync(payload));
                    }),
                    // [todo] dirty fix to make it work if data source returns data synchronously
                    switchMap(
                        packet => new Promise<EntityStreamPacket>(resolve => setTimeout(() => resolve(packet), 1))
                    ),
                    // [todo] cast
                    tap(packet => this.tracePacket(packet, endpoint, openQueries as IEntityQuery[]))
                );
            })
        ).pipe(startWith(initialPacket));

        return [stream, [...openQueries, ...fromCacheQueries]];
    }

    private tracePacket(packet: EntityStreamPacket, endpoint: EntitySourceEndpoint, accepted: IEntityQuery[]): void {
        const relevantAccepted = accepted.filter(acceptedQuery =>
            packet.getPayload().some(payload => payload.getQuery().intersect(acceptedQuery))
        );

        relevantAccepted.forEach(query =>
            this.services.getTracing().endpointDeliveredPacket(query, endpoint.getCriterionShape(), packet)
        );
    }

    private invokedToDataStream(invoked: ReturnType<EntitySourceEndpointInvoke>): Observable<EntitySourceEndpointData> {
        if (invoked instanceof Promise) {
            return from(invoked);
        } else if (Array.isArray(invoked) || invoked instanceof EntitySet || !isObservable(invoked)) {
            return of(invoked);
        } else {
            return invoked as Observable<EntitySourceEndpointData>;
        }
    }

    private endpointDataToPacket(query: IEntityQuery, data: EntitySourceEndpointData): EntityStreamPacket {
        if (data instanceof EntitySet) {
            // if we have an EntitySet, the source told us exactly what has been delivered
            return new EntityStreamPacket({ delivered: [data.getQuery()], payload: [data] });
        } else {
            // if instead all we have is just an array of entities, we assume that everything has been delivered
            const entities = Array.isArray(data) ? data : [data];
            return new EntityStreamPacket({ delivered: [query], payload: [new EntitySet({ entities, query })] });
        }
    }

    private getEndpointsAcceptingSchema(schema: IEntitySchema): EntitySourceEndpoint[] {
        return this.endpoints.filter(endpoint => endpoint.getSchema().getId() === schema.getId());
    }
}
