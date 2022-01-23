import { TokenType } from "@entity-space/lexer";
import { isValue, notValue } from "../../criterion";
import { TokenParser } from "./token-parser.type";

export function* valueCriterionTokenParser(): TokenParser {
    let token = yield;
    let not = false;

    if (token.type === TokenType.Special && token.value === "!") {
        not = true;
        token = yield;
    }

    if (token.type === TokenType.String) {
        return () => (not ? notValue(token.value) : isValue(token.value));
    } else if (token.type === TokenType.Number) {
        return () => (not ? notValue(parseFloat(token.value)) : isValue(parseFloat(token.value)));
    }

    return false;
}
