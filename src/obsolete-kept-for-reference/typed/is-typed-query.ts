import { Class } from "../../utils";
import { TypedQuery } from "./typed-query";
import { Query } from "../query";

export function isTypedQuery<T>(query: any, model: Class<T>[]): query is TypedQuery<T> {
    return model.every(x => (query as Query).model.includes(x));
}
