import { Observable } from "rxjs";
import { QueryStreamPacket } from "./query-stream-packet";
import { Query } from "./query";

export interface QueryStream {
    /**
     * What data we can be expect to be loaded.
     *
     * Can be undefined since the one who created the stream might not know
     * what the accessed endpoint is capable of.
     */
    target?: Query;

    /**
     * Start streaming in data in the form of packets, where each packet contains data and details
     * about loaded, open and failed queries.
     */
    open$(): Observable<QueryStreamPacket>;

    /**
     * [todo] just an idea: if something doesn't know the target in a synchronous situation,
     * we could let it supply this method to load it. this way we could support a "describe query"
     * functionality, with which a developer can figure out what would be executed for a query they issue.
     */
    determineTarget$?(): Observable<Query>;
}
