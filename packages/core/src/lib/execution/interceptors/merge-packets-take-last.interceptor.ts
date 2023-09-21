import { map, takeLast, tap } from "rxjs";
import { Entity } from "../../common/entity.type";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

export class MergePacketsTakeLastInterceptor implements IEntityStreamInterceptor {
    getName(): string {
        return MergePacketsTakeLastInterceptor.name;
    }

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        // [todo] have to utilize database until we can merge EntitySets without it
        const database = new InMemoryEntityDatabase();
        let mergedPacket = new EntityStreamPacket();

        return stream.pipe(
            tap(packet => {
                mergedPacket = mergedPacket.merge(packet);
                packet.getPayload().forEach(payload => {
                    database.upsertSync(payload);
                });
            }),
            takeLast(1),
            map(() => {
                const accepted = mergedPacket.getAcceptedQueries();
                const payload = accepted.map(query => database.querySync(query));

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
