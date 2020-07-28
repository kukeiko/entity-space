import { Query } from "./query";
import { QueryStream } from "./query-stream";

export interface QueryTranslator {
    translate(query: Query): QueryStream[];
}
