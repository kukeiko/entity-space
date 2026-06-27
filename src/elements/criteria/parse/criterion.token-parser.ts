import { parallelParser } from "@entity-space/lexer";
import { criteriaTokenParser } from "./criteria.token-parser";
import { CriterionTokenParser } from "./criterion-token-parser.type";
import { entityCriterionTokenParser } from "./entity-criterion.token-parser";
import { inArrayCriterionTokenParser } from "./in-array-criterion.token-parser";
import { inRangeCriterionTokenParser } from "./in-range-criterion.token-parser";
import { noneCriterionTokenParser } from "./none-criterion.token-parser";
import { someCriterionTokenParser } from "./some-criterion.token-parser";
import { valueCriterionTokenParser } from "./value-criterion.token-parser";

export function criterionTokenParser(): CriterionTokenParser {
    return parallelParser([
        () => criteriaTokenParser(),
        () => inRangeCriterionTokenParser(),
        () => inArrayCriterionTokenParser(),
        () => entityCriterionTokenParser(),
        () => valueCriterionTokenParser(),
        // [todo] ❓ someCriterionTokenParser() and noneCriterionTokenParser() have equal implementation, differing only in
        // what string (some/none) they expect and what type of criterion they return. could refactor into one fn instead.
        () => someCriterionTokenParser(),
        () => noneCriterionTokenParser(),
    ]) as CriterionTokenParser;
}
