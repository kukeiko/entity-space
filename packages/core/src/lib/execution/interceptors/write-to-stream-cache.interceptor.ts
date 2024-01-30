import { tap } from "rxjs";
import { EntitySet } from "../../entity/entity-set";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntityStream } from "../entity-stream";
import { IEntityStreamInterceptor } from "../entity-stream-interceptor.interface";

export class WriteToStreamCacheInterceptor implements IEntityStreamInterceptor {
    getName(): string {
        return WriteToStreamCacheInterceptor.name;
    }

    intercept(stream: EntityStream, context: EntityQueryExecutionContext): EntityStream {
        const upsertedPayloads = new Set<EntitySet>();

        return stream.pipe(
            tap(packet => {
                packet
                    .getPayload()
                    .filter(payload => !upsertedPayloads.has(payload))
                    .forEach(payload => {
                        context.getStreamCache().upsert(payload);
                        upsertedPayloads.add(payload);
                    });
            })
        );
    }
}
