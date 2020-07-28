import { Class } from "../utils";
import { TypedQuery } from "./typed-query";

export function isTypedQuery<T extends TypedQuery>(query: any, type: Class<T>): query is T {
    return query instanceof type;
}
