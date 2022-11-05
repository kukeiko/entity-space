import { Entity, IEntitySchema } from "@entity-space/common";
import { isNotFalse } from "@entity-space/utils";
import { flatten } from "lodash";
import { filter, from, map, merge, mergeAll, Observable, of, startWith, switchMap, tap } from "rxjs";
import { EntitySet } from "../entity/data-structures/entity-set";
import { IEntityDatabase } from "../entity/i-entity-database";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { EntityQueryTemplate } from "../query/entity-query-template";
import { Query } from "../query/query";
import { reduceQueries } from "../query/reduce-queries.fn";
import { EntityQueryTracing } from "../tracing/entity-query-tracing";
import { EntityApiEndpoint, EntityApiEndpointData, EntityApiEndpointInvoke } from "./entity-api-endpoint";
import { EntityApiEndpointBuilder } from "./entity-api-endpoint-builder";
import { IEntityStreamInterceptor } from "./i-entity-stream-interceptor";
import { QueryStream } from "./query-stream";
import { QueryStreamPacket } from "./query-stream-packet";

export class EntityApi implements IEntityStreamInterceptor {
    constructor(protected readonly tracing: EntityQueryTracing) {}

    protected endpoints: EntityApiEndpoint[] = [];

    addEndpoint<T extends Entity>(
        schema: IEntitySchema<T>,
        build: (builder: EntityApiEndpointBuilder<T>) => unknown
    ): this {
        const builder = new EntityApiEndpointBuilder<T>(schema);
        build(builder);
        this.endpoints.push(builder.build());

        return this;
    }

    intercept(stream: QueryStream): QueryStream {
        const db = new InMemoryEntityDatabase(); // [todo] remove

        return merge(
            stream.pipe(map(QueryStreamPacket.withoutRejected)),
            stream.pipe(
                filter(QueryStreamPacket.containsRejected),
                map(packet => this.query$(packet.getRejectedQueries(), db)),
                mergeAll()
            )
        );
    }

    query$<T extends Entity = Entity>(queries: Query[], database: IEntityDatabase): Observable<QueryStreamPacket<T>> {
        const streams = queries.map(query => {
            const endpoints = this.getEndpointsAcceptingSchema(query.getEntitySchema());
            const [delegatedStreams, acceptedQueries] = this.dispatchToEndpoints(query, endpoints, database);
            const rejectedQueries = reduceQueries(queries, acceptedQueries);
            const initialPackets: QueryStreamPacket[] = [];

            if (!rejectedQueries || rejectedQueries.length) {
                initialPackets.push(new QueryStreamPacket({ rejected: rejectedQueries || queries }));
            }

            return merge(...initialPackets.map(packet => of(packet)), ...delegatedStreams);
        });

        return merge(...streams) as Observable<QueryStreamPacket<T>>;
    }

    private dispatchToEndpoints(
        query: Query,
        endpoints: EntityApiEndpoint[],
        database: IEntityDatabase
    ): [QueryStream[], Query[]] {
        let open: Query[] = [query];
        const delegatedStreams: QueryStream[] = [];
        const acceptedQueries: Query[] = [];

        for (const endpoint of endpoints) {
            const dispatched = this.dispatchToEndpoint(endpoint, open, database);

            if (!dispatched) {
                continue;
            }

            delegatedStreams.push(dispatched[0]);
            acceptedQueries.push(...dispatched[1]);
            open = reduceQueries(open, dispatched[1]) || open;

            if (!open.length) {
                break;
            }
        }

        return [delegatedStreams, acceptedQueries];
    }

    private dispatchToEndpoint(
        endpoint: EntityApiEndpoint,
        queries: Query[],
        database: IEntityDatabase
    ): false | [Observable<QueryStreamPacket>, Query[]] {
        const queryTemplate = new EntityQueryTemplate({
            schema: endpoint.getSchema(),
            criterion: endpoint.getCriterionTemplate(),
            expansion: endpoint.getExpansion(),
            options: endpoint.getOptionsTemplate(),
        });

        const remapped = flatten(queries.map(query => queryTemplate.remap(query)).filter(isNotFalse));

        if (!remapped) {
            return false;
        }

        const acceptedRemapped = remapped.filter(query => {
            if (query.getPaging() && !(endpoint.requiresPaging() || endpoint.supportsPaging())) {
                return false;
            } else if (!query.getPaging() && endpoint.requiresPaging()) {
                return false;
            } else if (!endpoint.acceptCriterion(query.getCriteria())) {
                return false;
            }

            return true;
        });

        if (!acceptedRemapped.length) {
            return false;
        }

        acceptedRemapped.forEach(query =>
            this.tracing.queryDispatchedToEndpoint(query, endpoint.getCriterionTemplate())
        );

        const initialPacket = new QueryStreamPacket({ accepted: acceptedRemapped });
        // console.log("✔️ ", acceptedRemapped.join(", "));

        const stream = merge(
            ...acceptedRemapped.map(query => {
                const invoked = endpoint.getInvoke()({
                    criterion: query.getCriteria(),
                    expansion: query.getExpansion().getValue(),
                    options: query.getOptions(),
                    paging: query.getPaging(),
                });

                return this.invokedToDataStream(invoked).pipe(
                    map(data => this.endpointDataToPacket(query, data)),
                    switchMap(packet => this.addPacketToDatabase(packet, database)),
                    tap(packet => this.tracePacket(packet, endpoint, acceptedRemapped))
                );
            })
        ).pipe(startWith(initialPacket));

        return [stream, acceptedRemapped];
    }

    private async addPacketToDatabase(
        packet: QueryStreamPacket,
        database: IEntityDatabase
    ): Promise<QueryStreamPacket> {
        await Promise.all(packet.getPayload().map(entitySet => database.upsert(entitySet)));

        return packet;
    }

    private tracePacket(packet: QueryStreamPacket, endpoint: EntityApiEndpoint, accepted: Query[]): void {
        const relevantAccepted = accepted.filter(acceptedQuery =>
            packet.getPayload().some(payload => payload.getQuery().intersect(acceptedQuery))
        );

        relevantAccepted.forEach(query =>
            this.tracing.endpointDeliveredPacket(query, endpoint.getCriterionTemplate(), packet)
        );
    }

    private invokedToDataStream(invoked: ReturnType<EntityApiEndpointInvoke>): Observable<EntityApiEndpointData> {
        if (invoked instanceof Promise) {
            return from(invoked);
        } else if (Array.isArray(invoked) || invoked instanceof EntitySet || !(invoked instanceof Observable)) {
            return of(invoked);
        } else {
            return invoked;
        }
    }

    private endpointDataToPacket(query: Query, data: EntityApiEndpointData): QueryStreamPacket {
        if (data instanceof EntitySet) {
            // if we have an EntitySet, the source told us exactly what has been delivered
            return new QueryStreamPacket({ payload: [data] });
        } else {
            // if instead all we have is just an array of entities, we assume that everything has been delivered
            const entities = Array.isArray(data) ? data : [data];

            return new QueryStreamPacket({ payload: [new EntitySet({ entities, query })] });
        }
    }

    private getEndpointsAcceptingSchema(schema: IEntitySchema): EntityApiEndpoint[] {
        return this.endpoints.filter(endpoint => endpoint.getSchema().getId() === schema.getId());
    }
}
