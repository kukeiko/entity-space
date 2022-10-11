import { TokenType } from "@entity-space/lexer";
import { inSet } from "../criterion/set/in-set.fn";
import { notInSet } from "../criterion/set/not-in-set.fn";
import { CriterionTokenParser } from "./criterion-token-parser.type";

const literalsMap = new Map([
    ["true", true],
    ["false", false],
    ["null", null],
]);

export function* setCriterionTokenParser(): CriterionTokenParser {
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

    let items: (string | number | boolean | null)[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if ([TokenType.Number, TokenType.String, TokenType.Literal].includes(token.type)) {
            if (token.type === TokenType.Literal) {
                const literalValue = literalsMap.get(token.value);

                if (literalValue !== void 0) {
                    items.push(literalValue);
                } else {
                    return false;
                }
            } else {
                items.push(token.type === TokenType.Number ? parseFloat(token.value) : token.value);
            }

            token = yield;

            if (token.type === TokenType.Special && token.value === "}") {
                return () => (isNegated ? notInSet(items as any) : inSet(items as any));
            } else if (!(token.type === TokenType.Special && token.value === ",")) {
                return false;
            }

            token = yield;
        } else {
            return false;
        }
    }
}
