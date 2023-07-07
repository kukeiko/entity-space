import { filter, forkJoin, map, merge, of, switchMap } from "rxjs";
import { Entity } from "../../common/entity.type";
import { EntityCriteriaTools } from "../../criteria/entity-criteria-tools";
import { IEntityDatabase } from "../../entity/entity-database.interface";
import { EntityQueryTools } from "../../query/entity-query-tools";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

export class LoadFromCacheInterceptor implements IEntityStreamInterceptor {
    constructor(private readonly database: IEntityDatabase) {}

    private readonly criteriaTools = new EntityCriteriaTools();
    private readonly queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected)),
            stream.pipe(
                filter(EntityStreamPacket.hasRejected),
                switchMap(packet => forkJoin({ packet: of(packet), cachedQueries: this.database.getCachedQueries$() })),
                switchMap(({ cachedQueries, packet }) => {
                    const open = this.queryTools.subtractQueries(packet.getRejectedQueries(), cachedQueries);

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
                        ...accepted.map(query =>
                            this.database.query$(query).pipe(
                                map(
                                    entities =>
                                        new EntityStreamPacket({
                                            accepted: [entities.getQuery()],
                                            payload: [entities],
                                        })
                                )
                            )
                        )
                    );
                })
            )
        );
    }
}
