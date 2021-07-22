import { parseTokensGenerator } from "./parse-tokens.generator";
import { parseInRangeGenerator } from "./parse-in-range.generator";
import { parseInSetGenerator } from "./parse-in-set.generator";
import { ParseTokenGenerator } from "./parse-token-generator.type";
import { parseValueCriteriaGenerator } from "./parse-value-criteria.generator";
import { parseEntityCriterionGenerator } from "./parse-entity-criterion.generator";
import { parseBinaryCriterionGenerator } from "./parse-binary-criterion.generator";

export function parseValueCriterionGenerator(): ParseTokenGenerator {
    return parseTokensGenerator([parseValueCriteriaGenerator, parseInRangeGenerator, parseInSetGenerator, parseEntityCriterionGenerator, parseBinaryCriterionGenerator]);
}
