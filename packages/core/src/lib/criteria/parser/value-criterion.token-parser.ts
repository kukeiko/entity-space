import { TokenType } from "../../lexer/token-type.enum";
import { isEven } from "../criterion/binary/is-even.fn";
import { Criterion } from "../criterion/criterion";
import { isValue } from "../criterion/value/is-value.fn";
import { notValue } from "../criterion/value/not-value.fn";
import { CriterionTokenParser } from "./criterion-token-parser.type";

const binaryCriterionMapping: Record<string, (truthy: boolean) => Criterion> = {
    true: (truthy: boolean) => (truthy ? isValue(true) : notValue(true)),
    false: (truthy: boolean) => (truthy ? isValue(false) : notValue(false)),
    null: (truthy: boolean) => (truthy ? isValue(null) : notValue(null)),
    even: (truthy: boolean) => isEven(truthy),
    odd: (truthy: boolean) => isEven(!truthy),
};

export function* valueCriterionTokenParser(): CriterionTokenParser {
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
