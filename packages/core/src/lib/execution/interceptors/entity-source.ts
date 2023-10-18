import { isNotFalse } from "@entity-space/utils";
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
import { EntitySourceEndpoint, EntitySourceEndpointData, EntitySourceEndpointInvoke } from "./entity-source-endpoint";
import { EntityServiceContainer } from "../entity-service-container";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
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

    private dispatchToEndpoints(query: IEntityQuery, endpoints: EntitySourceEndpoint[]): [EntityStream[], IEntityQuery[]] {
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

        acceptedReshaped.forEach(query =>
            this.services.getTracing().queryDispatchedToEndpoint(queries, query, endpoint.getCriterionShape())
        );

        const initialPacket = new EntityStreamPacket({ accepted: acceptedReshaped });
        const whereEntityShape = endpoint.getWhereEntityShape();

        const stream = merge(
            ...acceptedReshaped.map(query => {
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
                    tap(packet => this.tracePacket(packet, endpoint, acceptedReshaped))
                );
            })
        ).pipe(startWith(initialPacket));

        return [stream, acceptedReshaped];
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
