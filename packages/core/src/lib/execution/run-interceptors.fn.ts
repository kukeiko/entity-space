import { isNotFalse } from "@entity-space/utils";
import { flatMap } from "lodash";
import { catchError, defaultIfEmpty, EMPTY, map, merge, of, shareReplay, switchMap, takeLast, tap } from "rxjs";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { EntityQueryError } from "../query/entity-query-error";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";
import { EntityQueryExecutionContext } from "./entity-query-execution-context";

function safeWrapEntityStream(
    stream: EntityStream,
    query: IEntityQuery,
    tracing: EntityQueryTracing,
    interceptorName: string
): EntityStream {
    const safelyWrapped = stream.pipe(
        // a stream that doesn't emit anything is equal to a stream emitting 1x packet that rejects all queries
        defaultIfEmpty(new EntityStreamPacket({ rejected: [query] })),
        // make sure uncaught errors are mapped to QueryErrors so that the stream doesn't get prematurely aborted
        catchError(error => of(new EntityStreamPacket({ errors: [new EntityQueryError(query, error)] }))),
        map(packet => {
            if (!packet.getAcceptedQueries().length) {
                return packet;
            }

            // [todo] document why I added this intersection
            const intersected = flatMap(packet.getAcceptedQueries(), accepted => query.intersect(accepted)).filter(
                isNotFalse
            );

            return new EntityStreamPacket({
                accepted: intersected,
                errors: packet.getErrors(),
                payload: packet.getPayload(),
                rejected: packet.getRejectedQueries(),
                delivered: packet.getDeliveredQueries(),
            });
        }),
        // prevent unnecessarily repeating potentially costly calls (e.g. accessing http resources)
        shareReplay()
    );

    const accepted: IEntityQuery[] = [];
    const rejected: IEntityQuery[] = [];
    const queryTools = new EntityQueryTools({ criteriaTools: new EntityCriteriaTools() });
    const { subtractQueries } = queryTools.toDestructurable();

    // make sure we're not missing any rejections
    const ensureProperRejection = safelyWrapped.pipe(
        tap(packet => {
            accepted.push(...packet.getAcceptedQueries());
            rejected.push(...packet.getRejectedQueries());
        }),
        takeLast(1),
        switchMap(() => {
            const notReportedAsRejected = subtractQueries([query], [...accepted, ...rejected]);

            if (!notReportedAsRejected) {
                tracing.streamDidNotReportAnyRejections(query, interceptorName);
                // original stream didn't report any meaningful rejections
                return of(new EntityStreamPacket({ rejected: [query] }));
            } else if (!notReportedAsRejected.length) {
                // original stream correctly reported all rejections
                return EMPTY;
            } else {
                // original stream missed to report some rejections
                tracing.streamDidNotReportSomeRejections(query, notReportedAsRejected, interceptorName);
                return of(new EntityStreamPacket({ rejected: notReportedAsRejected }));
            }
        })
    );

    return merge(safelyWrapped, ensureProperRejection);
}

export function runInterceptors(
    interceptors: IEntityStreamInterceptor[],
    query: IEntityQuery,
    tracing: EntityQueryTracing,
    context: EntityQueryExecutionContext
): EntityStream {
    let startWith = of(new EntityStreamPacket({ rejected: [query] }));

    return interceptors.reduce(
        (previous, interceptor) =>
            safeWrapEntityStream(interceptor.intercept(previous, context), query, tracing, interceptor.getName()),
        startWith
    );
}
