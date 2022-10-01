import { Criterion, or } from "@entity-space/criteria";
import { from, merge, Observable, of, startWith, switchMap } from "rxjs";
import { Entity, EntitySet } from "../../entity";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { IEntitySchema } from "../../schema";
import { mergeQueries } from "../merge-queries.fn";
import { Query } from "../query";
import { EntityControllerEndpoint } from "./entity-controller-endpoint";
import { EntityControllerEndpointBuilder } from "./entity-controller-endpoint-builder";
import { IEntitySource_V2 } from "./i-entity-source-v2";
import { QueryStream } from "./query-stream";
import { QueryStreamPacket } from "./query-stream-packet";

export class EntityController implements IEntitySource_V2 {
    protected endpoints: EntityControllerEndpoint[] = [];

    addEndpoint<T>(schema: IEntitySchema<T>, build: (builder: EntityControllerEndpointBuilder<T>) => unknown): this {
        const builder = new EntityControllerEndpointBuilder<T>(schema);
        build(builder);
        this.endpoints.push(builder.build());

        return this;
    }

    query_v2<T extends Entity = Entity>(
        queries: Query[],
        cache: InMemoryEntityDatabase
    ): Observable<QueryStreamPacket<T>> {
        const streams = queries.map(query => {
            const endpoints = this.getEndpointsAcceptingSchema(query.getEntitySchema());
            const [delegatedStreams, openCriteria] = this.dispatchToEndpoints(query, endpoints, cache);

            const initialPackets: QueryStreamPacket[] = [];

            if (openCriteria.length) {
                const rejected = [new Query(query.getEntitySchema(), or(openCriteria), query.getExpansion())];
                initialPackets.push(new QueryStreamPacket({ rejected }));
            }

            return merge(...initialPackets.map(packet => of(packet)), ...delegatedStreams);
        });

        return merge(...streams) as Observable<QueryStreamPacket<T>>;
    }

    private dispatchToEndpoints(
        query: Query,
        endpoints: EntityControllerEndpoint[],
        cache: InMemoryEntityDatabase
    ): [QueryStream[], Criterion[]] {
        let openCriteria: Criterion[] = [query.getCriteria()];
        const delegatedStreams: QueryStream[] = [];

        for (const endpoint of endpoints) {
            const dispatched = this.dispatchToEndpoint(
                endpoint,
                new Query(query.getEntitySchema(), or(openCriteria), query.getExpansion()),
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
        endpoint: EntityControllerEndpoint,
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
            ...acceptedCriteria.map(criterion => new Query(endpoint.getSchema(), criterion, effectiveExpansion))
        );

        const stream = merge(
            ...accepted.map(query => {
                const invoked = endpoint.getInvoke()({
                    criterion: query.getCriteria(),
                    expansion: query.getExpansion().getValue(),
                });
                let stream$: Observable<Entity | Entity[] | EntitySet>;

                // [todo] go truly different code paths instead of wrapping all to a stream$
                // (mainly because I want to support synchronous execution)
                if (invoked instanceof Promise) {
                    stream$ = from(invoked);
                } else if (Array.isArray(invoked) || invoked instanceof EntitySet || !(invoked instanceof Observable)) {
                    stream$ = of(invoked);
                } else {
                    stream$ = invoked;
                }

                return stream$.pipe(
                    switchMap(data => {
                        if (data instanceof EntitySet) {
                            cache.addEntities(data.getQuery().getEntitySchema(), data.getEntities());

                            // if instead we have an EntitySet, the source told us exactly what has been delivered
                            return of(
                                new QueryStreamPacket({
                                    delivered: [data.getQuery()], // [todo] remove
                                    payload: [new EntitySet({ query, entities: data.getEntities() })],
                                })
                            );
                        } else {
                            const entities = Array.isArray(data) ? data : [data];
                            cache.addEntities(query.getEntitySchema(), entities);

                            // if all we have is just an array of entities, we assume that everything has been delivered
                            return of(
                                new QueryStreamPacket({
                                    delivered: [query],
                                    // [todo] remove
                                    payload: [new EntitySet({ query, entities })],
                                })
                            );
                        }
                    })
                );
            })
        ).pipe(startWith(new QueryStreamPacket({ accepted })));

        const rejected = or(acceptedCriteria).reduce(or(remapped.getCriteria()));

        return [stream, [...remapped.getOpen(), ...(rejected !== false && rejected !== true ? [rejected] : [])]];
    }

    private getEndpointsAcceptingSchema(schema: IEntitySchema): EntityControllerEndpoint[] {
        return this.endpoints.filter(endpoint => endpoint.getSchema().getId() === schema.getId());
    }
}
