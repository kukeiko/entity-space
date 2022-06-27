import { Criterion, or } from "@entity-space/criteria";
import { merge, Observable, of, startWith } from "rxjs";
import { Entity } from "../../entity";
import { ExpansionObject } from "../../expansion/expansion-object";
import { IEntitySchema } from "../../schema";
import { mergeQueries } from "../merge-queries.fn";
import { Query } from "../query";
import { EntityControllerEndpoint } from "./entity-controller-endpoint";
import { IEntitySource_V2 } from "./i-entity-source-v2";
import { QueryStreamPacket } from "./query-stream-packet";

export class EntityController implements IEntitySource_V2 {
    protected endpoints: EntityControllerEndpoint[] = [];

    addEndpoint(endpoint: EntityControllerEndpoint): this {
        this.endpoints.push(endpoint);
        return this;
    }

    query_v2<T extends Entity = Entity>(
        queries: Query<T, Criterion, ExpansionObject<Record<string, unknown>>>[]
    ): Observable<QueryStreamPacket<T>> {
        const streams = queries.map(query => {
            const initialPackets: QueryStreamPacket[] = [];
            const delegatedStreams: Observable<QueryStreamPacket>[] = [];
            const endpoints = this.getEndpointsAcceptingSchema(query.getEntitySchema());
            let openCriteria: Criterion[] = [query.getCriteria()];

            for (const endpoint of endpoints) {
                const dispatched = this.dispatchToEndpoint(
                    endpoint,
                    new Query(query.getEntitySchema(), or(openCriteria), query.getExpansion())
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

            if (openCriteria.length) {
                const rejected = [new Query(query.getEntitySchema(), or(openCriteria), query.getExpansion())];
                initialPackets.push(new QueryStreamPacket({ rejected }));
            }

            return merge(...initialPackets.map(packet => of(packet)), ...delegatedStreams);
        });

        return merge(...streams) as Observable<QueryStreamPacket<T>>;
    }

    private dispatchToEndpoint(
        endpoint: EntityControllerEndpoint,
        query: Query
    ): false | [Observable<QueryStreamPacket>, Criterion[]] {
        const remapped = endpoint.getTemplate().remap(or(query.getCriteria()));

        if (!remapped) {
            return false;
        }

        const supportedExpansion = endpoint.getExpansion();
        // [todo] should be calculated instead
        const effectiveExpansion = supportedExpansion;

        const acceptedCriteria = remapped
            .getCriteria()
            .map(criterion => endpoint.acceptCriterion(criterion))
            .filter((criterion): criterion is Criterion => criterion !== false);

        if (!acceptedCriteria.length) {
            return false;
        }

        const accepted = mergeQueries(
            ...acceptedCriteria.map(criterion => new Query(endpoint.getSchema(), criterion, effectiveExpansion))
        );

        const stream = merge(
            ...accepted.map(query => {
                return endpoint.getInvoke()(query);
            })
        ).pipe(startWith(new QueryStreamPacket({ accepted })));

        return [stream, remapped.getOpen()];
    }

    private getEndpointsAcceptingSchema(schema: IEntitySchema): EntityControllerEndpoint[] {
        return this.endpoints.filter(endpoint => endpoint.getSchema().getId() === schema.getId());
    }
}
