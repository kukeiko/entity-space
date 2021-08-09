import { tokenParser } from "./token-parser";
import { inRangeCriterionTokenParser } from "./in-range-criterion.token-parser";
import { insetCriterionTokenParser } from "./in-set-criterion.token-parser";
import { TokenParser } from "./token-parser.type";
import { criteriaTokenParser } from "./criteria.token-parser";
import { namedCriteriaTokenParser } from "./named-criteria.token-parser";
import { binaryCriterionTokenParser } from "./binary-criterion.token-parser";

export function criterionTokenParser(): TokenParser {
    return tokenParser([criteriaTokenParser, inRangeCriterionTokenParser, insetCriterionTokenParser, namedCriteriaTokenParser, binaryCriterionTokenParser]);
}
