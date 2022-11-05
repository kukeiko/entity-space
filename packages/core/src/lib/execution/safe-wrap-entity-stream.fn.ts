import { isNotFalse } from "@entity-space/utils";
import { flatMap } from "lodash";
import { catchError, defaultIfEmpty, EMPTY, map, merge, of, shareReplay, switchMap, takeLast, tap } from "rxjs";
import { Query } from "../query/query";
import { reduceQueries } from "../query/reduce-queries.fn";
import { QueryStream } from "./query-stream";
import { QueryError, QueryStreamPacket } from "./query-stream-packet";

export function safeWrapEntityStream(stream: QueryStream, queries: Query[]): QueryStream {
    const safelyWrapped = stream.pipe(
        // a stream that doesn't emit anything is equal to a stream emitting 1x packet that rejects all queries
        defaultIfEmpty(new QueryStreamPacket({ rejected: queries })),
        // make sure uncaught errors are mapped to QueryErrors so that the stream doesn't get prematurely aborted
        catchError(error => of(new QueryStreamPacket({ errors: queries.map(query => new QueryError(query, error)) }))),
        map(packet => {
            if (!packet.getAcceptedQueries().length) {
                return packet;
            }

            const intersected = flatMap(packet.getAcceptedQueries(), accepted =>
                queries.map(query => query.intersect(accepted)).filter(isNotFalse)
            );

            return new QueryStreamPacket({
                accepted: intersected,
                errors: packet.getErrors(),
                payload: packet.getPayload(),
                rejected: packet.getRejectedQueries(),
            });
        }),
        // prevent unnecessarily repeating potentially costly calls (e.g. accessing http resources)
        shareReplay(1)
    );
    const accepted: Query[] = [];
    const rejected: Query[] = [];

    const trackAcceptedAndRejected = safelyWrapped.pipe(
        tap(packet => {
            accepted.push(...packet.getAcceptedQueries());
            rejected.push(...packet.getRejectedQueries());
        }),
        switchMap(() => EMPTY)
    );

    // make sure we're not missing any rejections
    const ensureProperRejection = safelyWrapped.pipe(
        takeLast(1),
        switchMap(() => {
            const notReportedAsRejected = reduceQueries(queries, [...accepted, ...rejected]);

            if (!notReportedAsRejected) {
                // original stream didn't report any meaningful rejections
                return of(new QueryStreamPacket({ rejected: queries }));
            } else if (!notReportedAsRejected.length) {
                // original stream correctly reported all rejections
                return EMPTY;
            } else {
                // original stream missed to report some rejections
                return of(new QueryStreamPacket({ rejected: notReportedAsRejected }));
            }
        })
    );

    return merge(safelyWrapped, trackAcceptedAndRejected, ensureProperRejection);
}
