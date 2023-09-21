import { EntityStream } from "../entity-stream";

export interface IEntityStreamInterceptor {
    getName(): string;
    intercept(stream: EntityStream): EntityStream;
}
