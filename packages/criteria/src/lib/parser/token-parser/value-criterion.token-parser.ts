import { TokenType } from "@entity-space/lexer";
import { IsNumberValueCriterion } from "../../criterion/value/is-number-value-criterion";
import { IsStringValueCriterion } from "../../criterion/value/is-string-value-criterion";
import { NotNumberValueCriterion } from "../../criterion/value/not-number-value-criterion";
import { NotStringValueCriterion } from "../../criterion/value/not-string-value-criterion";
import { TokenParser } from "./token-parser.type";

export function* valueCriterionTokenParser(): TokenParser {
    let token = yield;

    if (token.type !== TokenType.Literal || !["is", "not"].includes(token.value)) {
        return false;
    }

    let isTruthy = token.value === "is";
    token = yield;

    if (token.type === TokenType.Number) {
        return () =>
            isTruthy
                ? new IsNumberValueCriterion(parseFloat(token.value))
                : new NotNumberValueCriterion(parseFloat(token.value));
    } else if (token.type === TokenType.String) {
        return () => (isTruthy ? new IsStringValueCriterion(token.value) : new NotStringValueCriterion(token.value));
    }

    return false;
}

// export function* valueCriterionTokenParser(): TokenParser {
//     let token = yield;

//     if (token.type === TokenType.String) {
//         return () => new IsStringValueCriterion(token.value);
//     } else if (token.type === TokenType.Number) {
//         return () => new IsNumberValueCriterion(parseFloat(token.value));
//     }

//     return false;
// }
