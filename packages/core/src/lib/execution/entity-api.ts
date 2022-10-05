import { Entity } from "@entity-space/common";
import { Criterion, or } from "@entity-space/criteria";
import { from, map, merge, Observable, of, startWith, tap } from "rxjs";
import { EntitySet } from "../entity/data-structures/entity-set";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { mergeQueries } from "../query/merge-queries.fn";
import { Query } from "../query/query";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQueryTracing } from "../tracing/entity-query-tracing";
import { EntityApiEndpoint, EntityApiEndpointData, EntityApiEndpointInvoke } from "./entity-api-endpoint";
import { EntityApiEndpointBuilder } from "./entity-api-endpoint-builder";
import { IEntitySource } from "./i-entity-source";
import { QueryStream } from "./query-stream";
import { QueryStreamPacket } from "./query-stream-packet";

export class EntityApi implements IEntitySource {
    constructor(protected readonly tracing: EntityQueryTracing) {}

    protected endpoints: EntityApiEndpoint[] = [];

    addEndpoint<T>(schema: IEntitySchema<T>, build: (builder: EntityApiEndpointBuilder<T>) => unknown): this {
        const builder = new EntityApiEndpointBuilder<T>(schema);
        build(builder);
        this.endpoints.push(builder.build());

        return this;
    }

    query$<T extends Entity = Entity>(
        queries: Query[],
        cache: InMemoryEntityDatabase
    ): Observable<QueryStreamPacket<T>> {
        const streams = queries.map(query => {
            const endpoints = this.getEndpointsAcceptingSchema(query.getEntitySchema());
            const [delegatedStreams, openCriteria] = this.dispatchToEndpoints(query, endpoints, cache);

            const initialPackets: QueryStreamPacket[] = [];

            if (openCriteria.length) {
                const rejected = [new Query({ entitySchema: query.getEntitySchema(), criteria: or(openCriteria), expansion: query.getExpansion() })];
                initialPackets.push(new QueryStreamPacket({ rejected }));
            }

            return merge(...initialPackets.map(packet => of(packet)), ...delegatedStreams);
        });

        return merge(...streams) as Observable<QueryStreamPacket<T>>;
    }

    private dispatchToEndpoints(
        query: Query,
        endpoints: EntityApiEndpoint[],
        cache: InMemoryEntityDatabase
    ): [QueryStream[], Criterion[]] {
        let openCriteria: Criterion[] = [query.getCriteria()];
        const delegatedStreams: QueryStream[] = [];

        for (const endpoint of endpoints) {
            const dispatched = this.dispatchToEndpoint(
                endpoint,
                new Query({ entitySchema: query.getEntitySchema(), criteria: or(openCriteria), expansion: query.getExpansion() }),
                cache
            );

            if (!dispatched) {
                continue;
            }

            delegatedStreams.push(dispatched[0]);
            openCriteria = dispatched[1];

            if (!openCriteria.length) {
                break;
            }
        }

        return [delegatedStreams, openCriteria];
    }

    private dispatchToEndpoint(
        endpoint: EntityApiEndpoint,
        query: Query,
        cache: InMemoryEntityDatabase
    ): false | [Observable<QueryStreamPacket>, Criterion[]] {
        // [todo] why are the query criteria wrapped in an or()?
        const remapped = endpoint.getTemplate().remap(or(query.getCriteria()));

        if (!remapped) {
            return false;
        }

        const supportedExpansion = endpoint.getExpansion();
        const effectiveExpansion = supportedExpansion.intersect(query.getExpansion());

        if (!effectiveExpansion) {
            return false;
        }

        const acceptedCriteria = remapped.getCriteria().filter(criterion => endpoint.acceptCriterion(criterion));

        if (!acceptedCriteria.length) {
            return false;
        }

        const accepted = mergeQueries(
            ...acceptedCriteria.map(criterion => new Query({ entitySchema: endpoint.getSchema(), criteria: criterion, expansion: effectiveExpansion }))
        );

        accepted.forEach(query => this.tracing.queryDispatchedToEndpoint(query, endpoint.getTemplate()));

        const stream = merge(
            ...accepted.map(query => {
                const invoked = endpoint.getInvoke()({
                    criterion: query.getCriteria(),
                    expansion: query.getExpansion().getValue(),
                });

                return this.invokedToDataStream(invoked).pipe(
                    map(data => this.endpointDataToPacket(query, data)),
                    tap(packet => this.addPacketToDatabase(packet, cache)),
                    tap(packet => this.tracePacket(packet, endpoint, accepted))
                );
            })
        ).pipe(startWith(new QueryStreamPacket({ accepted })));

        const rejected = or(acceptedCriteria).reduce(or(remapped.getCriteria()));

        return [stream, [...remapped.getOpen(), ...(rejected !== false && rejected !== true ? [rejected] : [])]];
    }

    private addPacketToDatabase(packet: QueryStreamPacket, database: InMemoryEntityDatabase): void {
        packet
            .getPayload()
            .forEach(entitySet =>
                database.addEntities(entitySet.getQuery().getEntitySchema(), entitySet.getEntities())
            );
    }

    private tracePacket(packet: QueryStreamPacket, endpoint: EntityApiEndpoint, accepted: Query[]): void {
        accepted.forEach(query => this.tracing.endpointDeliveredPacket(query, endpoint.getTemplate(), packet));
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
