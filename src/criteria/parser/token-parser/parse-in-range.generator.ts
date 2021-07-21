import { inRange } from "../../value-criterion";
import { Token } from "../token.contract";
import { TokenType } from "../token-type.enum";
import { ParseTokenGenerator } from "./parse-token-generator.type";

function* acceptValue(): Generator<undefined, [string | number | undefined, typeof Number | typeof String | undefined] | false, Token> {
    let token = yield;

    if (token.type === TokenType.String) {
        return [token.value, String];
    } else if (token.type === TokenType.Number) {
        return [parseFloat(token.value), Number];
    } else if (token.type === TokenType.Special && token.value === ".") {
        token = yield;

        if (token.type !== TokenType.Special || token.value !== ".") return false;
        token = yield;

        if (token.type !== TokenType.Special || token.value !== ".") return false;

        return [void 0, void 0];
    } else {
        return false;
    }
}

export function* parseInRangeGenerator(): ParseTokenGenerator {
    let token = yield;

    if (token.type !== TokenType.Special || !"([".includes(token.value)) {
        return false;
    }

    const fromInclusive = token.value === "[";
    const fromValueResult = yield* acceptValue();
    if (fromValueResult === false) return false;
    const [fromValue] = fromValueResult;

    token = yield;

    if (token.type === TokenType.Special && ")]".includes(token.value)) {
        return () => inRange(fromValue as any, void 0, [fromInclusive, token.value === "]"] as any);
    } else if (token.type === TokenType.Special && token.value === ",") {
        const toValueResult = yield* acceptValue();
        if (toValueResult === false) return false;
        const [toValue] = toValueResult;

        token = yield;

        if (token.type === TokenType.Special && ")]".includes(token.value)) {
            return () => inRange(fromValue as any, toValue as any, [fromInclusive, token.value === "]"] as any);
        } else {
            return false;
        }
    } else {
        return false;
    }
}
