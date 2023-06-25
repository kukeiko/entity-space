import { EMPTY, merge, switchMap, takeLast, tap } from "rxjs";
import { Entity } from "../../common/entity.type";
import { EntityStream } from "../entity-stream";
import { EntityStreamPacket } from "../entity-stream-packet";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";

export type LogPacketsInterceptorOptions = { logEach?: boolean; logFinal?: boolean } | boolean;

export class LogPacketsInterceptor implements IEntityStreamInterceptor {
    constructor(private readonly options: LogPacketsInterceptorOptions) {}

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        let options = this.options;

        if (options === true) {
            options = { logEach: true, logFinal: true };
        } else if (options === false) {
            options = { logEach: false, logFinal: false };
        }

        const { logEach, logFinal } = options;

        const logEachStream = stream.pipe(
            tap(packet => {
                if (logEach) {
                    console.log(packet.toString());
                }
            }),
            switchMap(() => EMPTY)
        );

        let mergedPacket = new EntityStreamPacket();

        const logFinalStream = stream.pipe(
            tap(packet => {
                mergedPacket = mergedPacket.merge(packet);
            }),
            takeLast(1),
            tap(() => {
                if (logFinal) {
                    const accepted = mergedPacket.getAcceptedQueries().map(q => q.toString());
                    const rejected = mergedPacket.getRejectedQueries().map(q => q.toString());
                    const errors = mergedPacket.getErrors().map(q => q.getErrorMessage());
                    const entities = mergedPacket.getPayload().map(p => p.getEntities());

                    console.log("🎯 ✔️ ", JSON.stringify(accepted, void 0, 4));
                    console.log("🎯 ❌ ", JSON.stringify(rejected, void 0, 4));
                    console.log("🎯 🧨 ", JSON.stringify(errors, void 0, 4));
                    console.log("🎯 🎁 ", JSON.stringify(entities, void 0, 4));
                }
            }),
            switchMap(() => EMPTY)
        );

        return merge(stream, logEachStream, logFinalStream);
    }
}
