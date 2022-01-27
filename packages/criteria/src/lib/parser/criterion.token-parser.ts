import { criteriaTokenParser } from "./criteria.token-parser";
import { inRangeCriterionTokenParser } from "./in-range-criterion.token-parser";
import { setCriterionTokenParser } from "./set-criterion.token-parser";
import { namedCriteriaTokenParser } from "./named-criteria.token-parser";
import { tokenParser } from "./token-parser";
import { CriterionTokenParser } from "./criterion-token-parser.type";
import { valueCriterionTokenParser } from "./value-criterion.token-parser";

export function criterionTokenParser(): CriterionTokenParser {
    return tokenParser([
        criteriaTokenParser,
        inRangeCriterionTokenParser,
        setCriterionTokenParser,
        namedCriteriaTokenParser,
        valueCriterionTokenParser,
    ]);
}
