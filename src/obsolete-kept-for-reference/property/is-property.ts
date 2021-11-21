import { Property } from "./property";

export function isProperty(x?: any): x is Property {
    x = x || {};

    return typeof (x as Property).key === "string" && (x as Property).value != null;
}
