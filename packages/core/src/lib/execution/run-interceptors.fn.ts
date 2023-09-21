import { of } from "rxjs";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";
import { safeWrapEntityStream } from "./safe-wrap-entity-stream.fn";

export function runInterceptors(
    interceptors: IEntityStreamInterceptor[],
    queries: IEntityQuery[],
    tracing: EntityQueryTracing
): EntityStream {
    let startWith = of(new EntityStreamPacket({ rejected: queries }));

    return interceptors.reduce(
        (previous, interceptor) => safeWrapEntityStream(interceptor.intercept(previous), queries, tracing, interceptor.getName()),
        startWith
    );
}
