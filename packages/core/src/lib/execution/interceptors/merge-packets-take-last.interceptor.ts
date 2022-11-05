import { Entity } from "@entity-space/common";
import { map, takeLast, tap } from "rxjs";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { IEntityStreamInterceptor } from "../i-entity-stream-interceptor";
import { QueryStream } from "../query-stream";
import { QueryStreamPacket } from "../query-stream-packet";

export class MergePacketsTakeLastInterceptor implements IEntityStreamInterceptor {
    intercept(stream: QueryStream<Entity>): QueryStream<Entity> {
        // [todo] have to utilize database until we can merge EntitySets without it
        const database = new InMemoryEntityDatabase();
        let mergedPacket = new QueryStreamPacket();

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

                return new QueryStreamPacket({
                    accepted,
                    errors: mergedPacket.getErrors(),
                    rejected: mergedPacket.getRejectedQueries(),
                    payload,
                });
            })
        );
    }
}
