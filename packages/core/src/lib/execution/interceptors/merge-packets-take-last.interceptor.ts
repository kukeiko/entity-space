import { map, takeLast, tap } from "rxjs";
import { Entity } from "../../common/entity.type";
import { EntityCache } from "../entity-cache";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { IEntityToolbag } from "../entity-toolbag.interface";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

export class MergePacketsTakeLastInterceptor implements IEntityStreamInterceptor {
    constructor(private readonly toolbag: IEntityToolbag) {}

    getName(): string {
        return MergePacketsTakeLastInterceptor.name;
    }

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        const database = new EntityCache(this.toolbag);
        let mergedPacket = new EntityStreamPacket();

        return stream.pipe(
            tap(packet => {
                mergedPacket = mergedPacket.merge(packet);
                packet.getPayload().forEach(payload => {
                    database.upsert(payload);
                });
            }),
            takeLast(1),
            map(() => {
                const accepted = mergedPacket.getAcceptedQueries();
                const payload = accepted.map(query => database.query(query));

                return new EntityStreamPacket({
                    accepted,
                    errors: mergedPacket.getErrors(),
                    rejected: mergedPacket.getRejectedQueries(),
                    payload,
                });
            })
        );
    }
}
