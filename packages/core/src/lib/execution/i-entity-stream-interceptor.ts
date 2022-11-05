import { QueryStream } from "./query-stream";

export interface IEntityStreamInterceptor {
    intercept(stream: QueryStream): QueryStream;
}
