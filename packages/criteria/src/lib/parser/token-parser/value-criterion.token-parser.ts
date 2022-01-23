import { TokenType } from "@entity-space/lexer";
import { Criterion, isEven, isNull, isTrue, isValue, notValue } from "../../criterion";
import { TokenParser } from "./token-parser.type";

const binaryCriterionMapping: Record<string, (truthy: boolean) => Criterion> = {
    true: (truthy: boolean) => isTrue(truthy),
    false: (truthy: boolean) => isTrue(!truthy),
    null: (truthy: boolean) => isNull(truthy),
    even: (truthy: boolean) => isEven(truthy),
    odd: (truthy: boolean) => isEven(!truthy),
};

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
    } else if (token.type === TokenType.Literal) {
        const mapping = binaryCriterionMapping[token.value];

        if (mapping !== void 0) {
            return () => mapping(!not);
        }
    }

    return false;
}
