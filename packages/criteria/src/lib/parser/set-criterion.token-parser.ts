import { TokenType } from "@entity-space/lexer";
import { inSet } from "../criterion/set/in-set.fn";
import { notInSet } from "../criterion/set/not-in-set.fn";
import { CriterionTokenParser } from "./criterion-token-parser.type";

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

    let items: (string | number)[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if ([TokenType.Number, TokenType.String].includes(token.type)) {
            items.push(token.type === TokenType.Number ? parseFloat(token.value) : token.value);
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
