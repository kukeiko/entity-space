import { Json } from "@entity-space/utils";
import { TokenType } from "../token";
import { JsonParser } from "./json-parser.type";

const literals: Record<string, () => Json> = {
    true: () => true,
    false: () => false,
    null: () => null,
};

export function* jsonPrimitiveParser(): JsonParser {
    let token = yield;

    if (token.type === TokenType.String) {
        return () => token.value;
    } else if (token.type === TokenType.Number) {
        return () => +token.value;
    } else if (token.type === TokenType.Literal && token.value in literals) {
        return literals[token.value];
    }

    return false;
}
