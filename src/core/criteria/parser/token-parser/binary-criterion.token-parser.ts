import { IsEvenCriterion, IsFalseCriterion, IsNotNullCriterion, IsNullCriterion, IsOddCriterion, IsTrueCriterion, BinaryCriterion } from "../../criterion";
import { TokenType } from "../token-type.enum";
import { TokenParser } from "./token-parser.type";

const mappings: Record<string, () => BinaryCriterion<any>> = {
    "is-even": () => new IsEvenCriterion(),
    "is-odd": () => new IsOddCriterion(),
    "is-true": () => new IsTrueCriterion(),
    "is-false": () => new IsFalseCriterion(),
    "is-null": () => new IsNullCriterion(),
    "is-not-null": () => new IsNotNullCriterion(),
};

export function* binaryCriterionTokenParser(): TokenParser {
    let token = yield;
    if (token.type !== TokenType.Symbol) return false;
    const mapping = mappings[token.value];
    if (mapping === void 0) return false;

    return () => mapping();
}
