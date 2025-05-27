import { Token, TokenType } from "@entity-space/lexer";
import { InRangeCriterion } from "../in-range-criterion";
import { CriterionTokenParser } from "./criterion-token-parser.type";

function* valueParser(): Generator<
    undefined,
    [string | number | undefined, typeof Number | typeof String | undefined] | false,
    Token
> {
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

        return [undefined, undefined];
    } else {
        return false;
    }
}

export function* inRangeCriterionTokenParser(): CriterionTokenParser {
    let token = yield;

    // in-range has to start with either an inclusive "[" or exclusive "(" bracket
    if (token.type !== TokenType.Special || !"([".includes(token.value)) {
        return false;
    }

    const fromInclusive = token.value === "[";
    // expecting a string, a number or "..." sequence (to represent infinity)
    const fromValueResult = yield* valueParser();
    if (fromValueResult === false) return false;
    const [fromValue] = fromValueResult;

    token = yield;

    if (token.type === TokenType.Special && token.value === ",") {
        const toValueResult = yield* valueParser();
        if (toValueResult === false) return false;
        const [toValue] = toValueResult;

        token = yield;

        if (
            token.type === TokenType.Special &&
            ")]".includes(token.value) &&
            !(fromValue === undefined && toValue === undefined)
        ) {
            return () => new InRangeCriterion(fromValue, toValue, [fromInclusive, token.value === "]"]);
        } else {
            return false;
        }
    } else {
        return false;
    }
}
