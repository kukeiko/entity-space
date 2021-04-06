import { Query } from "./query";

export function queryToString(query: Query): string {
    return JSON.stringify(query);
}
