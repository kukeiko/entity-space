import { of } from "rxjs";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityStreamInterceptor } from "./i-entity-stream-interceptor";
import { safeWrapEntityStream } from "./safe-wrap-entity-stream.fn";

export function runInterceptors(interceptors: IEntityStreamInterceptor[], queries: IEntityQuery[]): EntityStream {
    let startWith = of(new EntityStreamPacket({ rejected: queries }));

    return interceptors.reduce(
        (previous, interceptor) => safeWrapEntityStream(interceptor.intercept(previous), queries),
        startWith
    );
}
