import { TokenType } from "@entity-space/lexer";
import { InArrayCriterion } from "../in-array-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { CriterionTokenParser } from "./criterion-token-parser.type";

const literalsMap = new Map([
    ["true", true],
    ["false", false],
    ["null", null],
    ["undefined", undefined],
]);

export function* inArrayCriterionTokenParser(): CriterionTokenParser {
    let token = yield;
    let isNegated = false;

    if (token.type === TokenType.Special && token.value === "!") {
        isNegated = true;
        token = yield;
    }

    if (!(token.type === TokenType.Special || token.value === "{")) {
        return false;
    }

    token = yield;

    const items: (string | number | boolean | null)[] = [];

    while (true) {
        if ([TokenType.Number, TokenType.String, TokenType.Literal].includes(token.type)) {
            if (token.type === TokenType.Literal) {
                if (literalsMap.has(token.value)) {
                    items.push(literalsMap.get(token.value)!);
                } else {
                    return false;
                }
            } else {
                items.push(token.type === TokenType.Number ? parseFloat(token.value) : token.value);
            }

            token = yield;

            if (token.type === TokenType.Special && token.value === "}") {
                return () => (isNegated ? new NotInArrayCriterion(items) : new InArrayCriterion(items));
            } else if (!(token.type === TokenType.Special && token.value === ",")) {
                return false;
            }

            token = yield;
        } else {
            return false;
        }
    }
}
