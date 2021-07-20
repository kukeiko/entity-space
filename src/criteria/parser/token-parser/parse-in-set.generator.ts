import { inSet, notInSet } from "../../value-criterion";
import { TokenType } from "../token-type.enum";
import { ParseTokenGenerator } from "./parse-token-generator.type";

export function* parseInSetGenerator(): ParseTokenGenerator {
    let token = yield true;
    let isNegated = false;

    if (token.type === TokenType.Special && token.value === "!") {
        isNegated = true;
        token = yield true;
    }

    if (!(token.type === TokenType.Special || token.value === "{")) {
        return false;
    }

    token = yield true;

    let items: (string | number)[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if ([TokenType.Number, TokenType.String].includes(token.type)) {
            items.push(token.type === TokenType.Number ? parseFloat(token.value) : token.value);
            token = yield true;

            if (token.type === TokenType.Special && token.value === "}") {
                return isNegated ? notInSet(items as any) : inSet(items as any);
            } else if (!(token.type === TokenType.Special && token.value === ",")) {
                return false;
            }

            token = yield true;
        } else {
            return false;
        }
    }
}
