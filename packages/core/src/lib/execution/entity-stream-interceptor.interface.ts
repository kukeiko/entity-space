import { EntityQueryExecutionContext } from "./entity-query-execution-context";
import { EntityStream } from "./entity-stream";

export interface IEntityStreamInterceptor {
    getName(): string;
    intercept(stream: EntityStream, context: EntityQueryExecutionContext): EntityStream;
}
