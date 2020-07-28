import { Observable } from "rxjs";
import { Query } from "./query";
import { QueryStreamPacket } from "./query-stream-packet";

export interface QueryStream<Q extends Query = Query> {
    /**
     * What data we can be expect to be loaded.
     *
     * Can be undefined since the one who created the stream might not know
     * what the accessed endpoint is capable of.
     */
    target?: Q;

    /**
     * Start streaming in data in the form of packets, where each packet contains data and details
     * about loaded, open and failed queries.
     */
    open$(): Observable<QueryStreamPacket<Q>>;

    /**
     * [todo] just an idea: if something doesn't know the target in a synchronous situation,
     * we could let it supply this method to load it. this way we could support a "describe query"
     * functionality, with which a developer can figure out what would be executed for a query they issue.
     */
    determineTarget$?(): Observable<Q>;
}
