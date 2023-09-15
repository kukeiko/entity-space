import { isNotFalse } from "@entity-space/utils";
import { flatMap } from "lodash";
import { catchError, defaultIfEmpty, EMPTY, map, merge, of, shareReplay, switchMap, takeLast, tap } from "rxjs";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { EntityQueryError } from "../query/entity-query-error";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";

export function safeWrapEntityStream(stream: EntityStream, queries: IEntityQuery[]): EntityStream {
    const safelyWrapped = stream.pipe(
        // a stream that doesn't emit anything is equal to a stream emitting 1x packet that rejects all queries
        defaultIfEmpty(new EntityStreamPacket({ rejected: queries })),
        // make sure uncaught errors are mapped to QueryErrors so that the stream doesn't get prematurely aborted
        catchError(error =>
            of(new EntityStreamPacket({ errors: queries.map(query => new EntityQueryError(query, error)) }))
        ),
        map(packet => {
            if (!packet.getAcceptedQueries().length) {
                return packet;
            }

            // [todo] document why I added this intersection
            const intersected = flatMap(packet.getAcceptedQueries(), accepted =>
                queries.map(query => query.intersect(accepted)).filter(isNotFalse)
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
    const { subtractQueries } = queryTools;

    // make sure we're not missing any rejections
    const ensureProperRejection = safelyWrapped.pipe(
        tap(packet => {
            accepted.push(...packet.getAcceptedQueries());
            rejected.push(...packet.getRejectedQueries());
        }),
        takeLast(1),
        switchMap(() => {
            const notReportedAsRejected = subtractQueries(queries, [...accepted, ...rejected]);

            if (!notReportedAsRejected) {
                console.log("🐞 original stream didn't report any meaningful rejections", queries.join(", "));
                // original stream didn't report any meaningful rejections
                return of(new EntityStreamPacket({ rejected: queries }));
            } else if (!notReportedAsRejected.length) {
                // original stream correctly reported all rejections
                return EMPTY;
            } else {
                // original stream missed to report some rejections
                console.log("🐞 original stream missed to report some rejections", notReportedAsRejected.join(", "));
                return of(new EntityStreamPacket({ rejected: notReportedAsRejected }));
            }
        })
    );

    return merge(safelyWrapped, ensureProperRejection);
}
