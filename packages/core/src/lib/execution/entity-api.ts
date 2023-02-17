import { isNotFalse } from "@entity-space/utils";
import { flatten } from "lodash";
import { filter, from, map, merge, mergeAll, Observable, of, startWith, switchMap, tap } from "rxjs";
import { Entity } from "../common/entity.type";
import { EntityCriteriaTools } from "../criteria/vnext/entity-criteria-tools";
import { EntityCriteriaShapeTools } from "../criteria/vnext/entity-criteria-shape-tools";
import { WhereEntityTools } from "../criteria/vnext/where-entity/where-entity-tools";
import { EntitySet } from "../entity/data-structures/entity-set";
import { IEntityDatabase } from "../entity/i-entity-database";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { EntityQueryTools } from "../query/entity-query-tools";
import { EntityQueryShape } from "../query/entity-query-shape";
import { IEntityQuery } from "../query/entity-query.interface";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityApiEndpoint, EntityApiEndpointData, EntityApiEndpointInvoke } from "./entity-api-endpoint";
import { EntityApiEndpointBuilder } from "./entity-api-endpoint-builder";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityStreamInterceptor } from "./i-entity-stream-interceptor";

export class EntityApi implements IEntityStreamInterceptor {
    constructor(protected readonly tracing: EntityQueryTracing) {}

    protected endpoints: EntityApiEndpoint[] = [];
    protected readonly criteriaTools = new EntityCriteriaTools();
    protected readonly queryTools = new EntityQueryTools({ criteriaFactory: this.criteriaTools });
    protected readonly shapeTools = new EntityCriteriaShapeTools({ criteriaTools: this.criteriaTools });
    protected readonly whereEntityTools = new WhereEntityTools(this.shapeTools, this.criteriaTools);

    addEndpoint<T extends Entity>(
        schema: IEntitySchema<T>,
        build: (builder: EntityApiEndpointBuilder<T>) => unknown
    ): this {
        const builder = new EntityApiEndpointBuilder<T>(schema);
        build(builder);
        this.endpoints.push(builder.build());

        return this;
    }

    intercept(stream: EntityStream): EntityStream {
        const db = new InMemoryEntityDatabase(); // [todo] remove

        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected)),
            stream.pipe(
                filter(EntityStreamPacket.containsRejected),
                map(packet => this.query$(packet.getRejectedQueries(), db)),
                mergeAll()
            )
        );
    }

    query$<T extends Entity = Entity>(
        queries: IEntityQuery[],
        database: IEntityDatabase
    ): Observable<EntityStreamPacket<T>> {
        const streams = queries.map(query => {
            const endpoints = this.getEndpointsAcceptingSchema(query.getEntitySchema());
            const [delegatedStreams, acceptedQueries] = this.dispatchToEndpoints(query, endpoints, database);
            const rejectedQueries = this.queryTools.subtractQueries(queries, acceptedQueries);
            const initialPackets: EntityStreamPacket[] = [];

            if (!rejectedQueries || rejectedQueries.length) {
                initialPackets.push(new EntityStreamPacket({ rejected: rejectedQueries || queries }));
            }

            return merge(...initialPackets.map(packet => of(packet)), ...delegatedStreams);
        });

        return merge(...streams) as Observable<EntityStreamPacket<T>>;
    }

    private dispatchToEndpoints(
        query: IEntityQuery,
        endpoints: EntityApiEndpoint[],
        database: IEntityDatabase
    ): [EntityStream[], IEntityQuery[]] {
        let open: IEntityQuery[] = [query];
        const delegatedStreams: EntityStream[] = [];
        const acceptedQueries: IEntityQuery[] = [];

        for (const endpoint of endpoints) {
            const dispatched = this.dispatchToEndpoint(endpoint, open, database);

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
        endpoint: EntityApiEndpoint,
        queries: IEntityQuery[],
        database: IEntityDatabase
    ): false | [Observable<EntityStreamPacket>, IEntityQuery[]] {
        const queryTemplate = new EntityQueryShape({
            schema: endpoint.getSchema(),
            criterion: endpoint.getCriterionTemplate(),
            selection: endpoint.getSelection(),
            options: endpoint.getOptionsTemplate(),
        });

        const remapped = flatten(queries.map(query => queryTemplate.reshape(query)).filter(isNotFalse));

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

        const initialPacket = new EntityStreamPacket({ accepted: acceptedRemapped });
        const whereEntityShape = endpoint.getWhereEntityShape();

        const stream = merge(
            ...acceptedRemapped.map(query => {
                const invoked = endpoint.getInvoke()({
                    query,
                    selection: query.getSelection().getValue(),
                    paging: query.getPaging(),
                    criteria: whereEntityShape
                        ? this.whereEntityTools.toWhereEntitySingleFromCriterion(query.getCriteria(), whereEntityShape)
                        : {},
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
        packet: EntityStreamPacket,
        database: IEntityDatabase
    ): Promise<EntityStreamPacket> {
        await Promise.all(packet.getPayload().map(entitySet => database.upsert(entitySet)));

        return packet;
    }

    private tracePacket(packet: EntityStreamPacket, endpoint: EntityApiEndpoint, accepted: IEntityQuery[]): void {
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

    private endpointDataToPacket(query: IEntityQuery, data: EntityApiEndpointData): EntityStreamPacket {
        if (data instanceof EntitySet) {
            // if we have an EntitySet, the source told us exactly what has been delivered
            return new EntityStreamPacket({ payload: [data] });
        } else {
            // if instead all we have is just an array of entities, we assume that everything has been delivered
            const entities = Array.isArray(data) ? data : [data];

            return new EntityStreamPacket({ payload: [new EntitySet({ entities, query })] });
        }
    }

    private getEndpointsAcceptingSchema(schema: IEntitySchema): EntityApiEndpoint[] {
        return this.endpoints.filter(endpoint => endpoint.getSchema().getId() === schema.getId());
    }
}
