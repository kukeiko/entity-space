import { parallelParser } from "@entity-space/lexer";
import { criteriaTokenParser } from "./criteria.token-parser";
import { CriterionTokenParser } from "./criterion-token-parser.type";
import { entityCriterionTokenParser } from "./entity-criterion.token-parser";
import { inArrayCriterionTokenParser } from "./in-array-criterion.token-parser";
import { inRangeCriterionTokenParser } from "./in-range-criterion.token-parser";
import { valueCriterionTokenParser } from "./value-criterion.token-parser";

export function criterionTokenParser(): CriterionTokenParser {
    return parallelParser([
        () => criteriaTokenParser(),
        () => inRangeCriterionTokenParser(),
        () => inArrayCriterionTokenParser(),
        () => entityCriterionTokenParser(),
        () => valueCriterionTokenParser(),
    ]) as CriterionTokenParser;
}
