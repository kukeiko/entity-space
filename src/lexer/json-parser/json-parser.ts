import { parallelParser } from "../parallel-parser";
import { jsonArrayParser } from "./json-array-parser";
import { jsonObjectParser } from "./json-object-parser";
import { JsonParser } from "./json-parser.type";
import { jsonPrimitiveParser } from "./json-primitive-parser";

export function jsonParser(): JsonParser {
    return parallelParser([
        () => jsonPrimitiveParser(),
        () => jsonArrayParser(),
        () => jsonObjectParser(),
    ]) as JsonParser;
}
