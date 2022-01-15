import { inSet, notInSet } from "../../criterion";
import { TokenType } from "../token-type.enum";
import { TokenParser } from "./token-parser.type";

export function* insetCriterionTokenParser(): TokenParser {
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
