import { isFalse, isNotFalse } from "@entity-space/utils";
import { flatten } from "lodash";
import { Observable, filter, from, isObservable, map, merge, mergeAll, of, startWith, switchMap, tap } from "rxjs";
import { WhereEntityTools } from "../../criteria/where-entity/where-entity-tools";
import { EntitySet } from "../../entity/entity-set";
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
    protected readonly criteriaTools = this.services.getToolbag().getCriteriaTools();
    protected readonly queryTools = this.services.getToolbag().getQueryTools();
    protected readonly shapeTools = this.services.getToolbag().getCriteriaShapeTools();
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
                map(packet => merge(...packet.getRejectedQueries().map(query => this.rejectedQueryToStream(query)))),
                mergeAll()
            )
        );
    }

    private rejectedQueryToStream(query: IEntityQuery): EntityStream {
        // [todo] we currently only have 1x EntitySchema per 1x EntitySource, making filtering endpoints by EntitySchema kind of useless.
        const endpoints = this.getEndpointsAcceptingSchema(query.getEntitySchema());

        if (!endpoints.length) {
            return of(new EntityStreamPacket({ rejected: [query] }));
        }

        const [streams, acceptedQueries] = this.dispatchToEndpoints(query, endpoints);
        const rejectedQueries = this.queryTools.subtractQueries([query], acceptedQueries);

        if (!rejectedQueries || rejectedQueries.length) {
            streams.push(of(new EntityStreamPacket({ rejected: rejectedQueries || [query] })));
        }

        return merge(...streams);
    }

    private dispatchToEndpoints(
        query: IEntityQuery,
        endpoints: EntitySourceEndpoint[]
    ): [EntityStream[], IEntityQuery[]] {
        let open: IEntityQuery[] = [query];
        const delegatedStreams: EntityStream[] = [];
        const acceptedQueries: IEntityQuery[] = [];

        for (const endpoint of endpoints) {
            const [stream, accepted] = this.dispatchToEndpoint(endpoint, open);

            if (!stream) {
                continue;
            }

            delegatedStreams.push(stream);
            acceptedQueries.push(...accepted);
            open = this.queryTools.subtractQueries(open, accepted) || open;

            if (!open.length) {
                break;
            }
        }

        return [delegatedStreams, acceptedQueries];
    }

    private dispatchToEndpoint(
        endpoint: EntitySourceEndpoint,
        queries: IEntityQuery[]
    ): [false] | [Observable<EntityStreamPacket>, IEntityQuery[]] {
        const acceptedReshaped = queries
            .map(query => endpoint.getQueryShape().reshape(query))
            .filter(isNotFalse)
            .flat()
            .filter(query => endpoint.acceptCriterion(query.getCriteria()));

        if (!acceptedReshaped.length) {
            return [false];
        }

        const results = acceptedReshaped.map(query => this.runQueryAgainstEndpoint(query, endpoint));

        if (results.every(isFalse)) {
            return [false];
        }

        const streams: EntityStream[] = [];
        const accepted: IEntityQuery[] = [];

        results.filter(isNotFalse).forEach(([stream, acceptedQueries]) => {
            streams.push(stream);
            accepted.push(...acceptedQueries);
        });

        return [merge(...streams), accepted];
    }

    private runQueryAgainstEndpoint(
        query: IEntityQuery,
        endpoint: EntitySourceEndpoint
    ): false | [streams: EntityStream, accepted: IEntityQuery[]] {
        let openQueries: IEntityQuery[] = [query];
        const streams: EntityStream[] = [];
        const fromCache = this.loadQueryFromCache(query, endpoint);
        let fromCacheQueries: IEntityQuery[] = [];

        if (fromCache !== false) {
            streams.push(fromCache[0]);
            openQueries = fromCache[1];
            fromCacheQueries = fromCache[2];

            if (!openQueries.length) {
                return [fromCache[0], [query]];
            }
        }

        const initialPacket = new EntityStreamPacket({ accepted: openQueries });
        const whereEntityShape = endpoint.getWhereEntityShape();

        openQueries.forEach(openQuery =>
            this.services.getTracing().queryDispatchedToEndpoint([query], openQuery, endpoint.getCriterionShape())
        );

        const stream = merge(
            ...streams,
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
                        packet.getPayload().forEach(payload => this.services.getCache().upsert(payload));
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

    private loadQueryFromCache(
        query: IEntityQuery,
        endpoint: EntitySourceEndpoint
    ): false | [streams: EntityStream, open: IEntityQuery[], fromCache: IEntityQuery[]] {
        const openQueries = this.services.getCache().subtractQuery(query);

        // nothing loaded from cache
        if (openQueries === false) {
            return false;
        }

        // everything loaded from cache
        if (!openQueries.length) {
            this.services.getTracing().queryWasLoadedFromCache(query);

            return [
                of(
                    new EntityStreamPacket({
                        accepted: [query],
                        delivered: [query],
                        payload: [this.services.getCache().query(query)],
                    })
                ),
                [],
                [query],
            ];
        }

        // potential for partially loading from cache
        const queryShape = endpoint.getQueryShape();
        const reshaped = openQueries.map(openQuery => {
            const reshaped = queryShape.reshape(openQuery);

            if (reshaped === false || !reshaped.length) {
                return false;
            } else {
                return reshaped;
            }
        });

        if (!reshaped.every(isNotFalse)) {
            return false;
        }

        // [todo] not quite sure why we're merging
        const merged = this.queryTools.mergeQueries(...reshaped.flat());
        const reshapedAgain = merged.map(mergedQuery => queryShape.reshape(mergedQuery));

        if (!reshapedAgain.every(isNotFalse)) {
            return false;
        }

        const fromCacheQueries = this.queryTools.subtractQueries([query], openQueries);

        if (fromCacheQueries === false || !fromCacheQueries.length) {
            throw new Error(`bad EntityQuery subtraction logic implementation`);
        }

        const fromCacheEntities = fromCacheQueries.map(query => this.services.getCache().query(query));

        // [todo] "query" argument should actually be the query initially passed to this method,
        // and then new arguments should exist to describe the actual query loaded from cache (as it could be a subset of the initial query)
        fromCacheQueries.forEach(query => this.services.getTracing().queryWasLoadedFromCache(query));

        return [
            of(
                new EntityStreamPacket({
                    accepted: fromCacheQueries,
                    delivered: fromCacheQueries,
                    payload: fromCacheEntities,
                })
            ),
            reshapedAgain.flat(),
            fromCacheQueries,
        ];
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
