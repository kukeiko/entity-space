import { Query } from "./query";
import { QueryStream } from "./query-stream";

export interface QueryTranslator<Q extends Query = Query> {
    translate(query: Q): QueryStream<Q>[];
}
