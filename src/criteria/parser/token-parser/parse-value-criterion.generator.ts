import { parseTokensGenerator } from "./parse-tokens.generator";
import { parseInRangeGenerator } from "./parse-in-range.generator";
import { parseInSetGenerator } from "./parse-in-set.generator";
import { ParseTokenGenerator } from "./parse-token-generator.type";
import { parseValueCriteriaGenerator } from "./parse-value-criteria.generator";

export function parseValueCriterionGenerator(): ParseTokenGenerator {
    return parseTokensGenerator([parseValueCriteriaGenerator, parseInRangeGenerator, parseInSetGenerator]);
}
