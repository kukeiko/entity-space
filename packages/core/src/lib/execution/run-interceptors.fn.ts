import { of } from "rxjs";
import { EntityQuery } from "../query/entity-query";
import { IEntityStreamInterceptor } from "./i-entity-stream-interceptor";
import { QueryStream } from "./query-stream";
import { QueryStreamPacket } from "./query-stream-packet";
import { safeWrapEntityStream } from "./safe-wrap-entity-stream.fn";

export function runInterceptors(interceptors: IEntityStreamInterceptor[], queries: EntityQuery[]): QueryStream {
    let startWith = of(new QueryStreamPacket({ rejected: queries }));

    return interceptors.reduce(
        (previous, interceptor) => safeWrapEntityStream(interceptor.intercept(previous), queries),
        startWith
    );
}
