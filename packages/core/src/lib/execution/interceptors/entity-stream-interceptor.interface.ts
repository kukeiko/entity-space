import { EntityStream } from "../entity-stream";

export interface IEntityStreamInterceptor {
    intercept(stream: EntityStream): EntityStream;
}
