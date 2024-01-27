import { filter, map, merge, mergeMap, of } from "rxjs";
import { Entity } from "../../common/entity.type";
import { EntityCriteriaTools } from "../../criteria/entity-criteria-tools";
import { EntityQueryTools } from "../../query/entity-query-tools";
import { IEntityCache } from "../entity-cache.interface";
import { EntityQueryTracing } from "../entity-query-tracing";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

export class LoadFromCacheInterceptor implements IEntityStreamInterceptor {
    constructor(private readonly cache: IEntityCache, private readonly tracing: EntityQueryTracing) {}

    private readonly criteriaTools = new EntityCriteriaTools();
    private readonly queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    getName(): string {
        return LoadFromCacheInterceptor.name;
    }

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected), filter(EntityStreamPacket.isNotEmpty)),
            stream.pipe(
                filter(EntityStreamPacket.hasRejected),
                mergeMap(packet => {
                    const open = this.cache.subtractQueries(packet.getRejectedQueries());

                    if (open === false) {
                        return of(packet);
                    }

                    const accepted = !open.length
                        ? packet.getRejectedQueries()
                        : this.queryTools.subtractQueries(packet.getRejectedQueries(), open);

                    if (accepted === false) {
                        throw new Error(`query subtraction logic error`);
                    }

                    return merge(
                        of(new EntityStreamPacket({ rejected: open })).pipe(filter(EntityStreamPacket.isNotEmpty)),
                        ...accepted.map(query => {
                            this.tracing.queryWasLoadedFromCache(query);
                            const entities = this.cache.query(query);

                            return of(
                                new EntityStreamPacket({
                                    accepted: [entities.getQuery()],
                                    payload: [entities],
                                    delivered: [entities.getQuery()],
                                })
                            );
                        })
                    );
                })
            )
        );
    }
}
