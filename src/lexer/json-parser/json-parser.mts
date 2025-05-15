import { parallelParser } from "../parallel-parser.mjs";
import { jsonArrayParser } from "./json-array-parser.mjs";
import { jsonObjectParser } from "./json-object-parser.mjs";
import { JsonParser } from "./json-parser.type.mjs";
import { jsonPrimitiveParser } from "./json-primitive-parser.mjs";

export function jsonParser(): JsonParser {
    return parallelParser([
        () => jsonPrimitiveParser(),
        () => jsonArrayParser(),
        () => jsonObjectParser(),
    ]) as JsonParser;
}
