import { TokenType } from "@entity-space/lexer";
import {
    BinaryCriterion,
    IsEvenCriterion,
    IsFalseCriterion,
    IsNotNullCriterion,
    IsNullCriterion,
    IsOddCriterion,
    IsTrueCriterion,
} from "../../criterion";
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
    if (token.type !== TokenType.Literal) return false;
    const mapping = mappings[token.value];
    if (mapping === void 0) return false;

    return () => mapping();
}
