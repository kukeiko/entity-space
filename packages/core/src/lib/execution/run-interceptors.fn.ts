import { of } from "rxjs";
import { EntityQuery } from "../query/entity-query";
import { IEntityStreamInterceptor } from "./i-entity-stream-interceptor";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { safeWrapEntityStream } from "./safe-wrap-entity-stream.fn";

export function runInterceptors(interceptors: IEntityStreamInterceptor[], queries: EntityQuery[]): EntityStream {
    let startWith = of(new EntityStreamPacket({ rejected: queries }));

    return interceptors.reduce(
        (previous, interceptor) => safeWrapEntityStream(interceptor.intercept(previous), queries),
        startWith
    );
}
