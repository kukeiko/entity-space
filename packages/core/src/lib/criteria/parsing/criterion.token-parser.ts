import { allNoneOrNeverCriterionTokenParser } from "./all-none-or-never-criterion.token-parser";
import { criteriaTokenParser } from "./criteria.token-parser";
import { CriterionTokenParser } from "./criterion-token-parser.type";
import { inRangeCriterionTokenParser } from "./in-range-criterion.token-parser";
import { namedCriteriaTokenParser } from "./entity-criteria.token-parser";
import { setCriterionTokenParser } from "./in-array-criterion.token-parser";
import { tokenParser } from "./token-parser";
import { valueCriterionTokenParser } from "./value-criterion.token-parser";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";

export function criterionTokenParser(tools: IEntityCriteriaTools): CriterionTokenParser {
    return tokenParser([
        () => criteriaTokenParser(tools),
        () => inRangeCriterionTokenParser(tools),
        () => setCriterionTokenParser(tools),
        () => namedCriteriaTokenParser(tools),
        () => valueCriterionTokenParser(tools),
        () => allNoneOrNeverCriterionTokenParser(tools),
    ]) as CriterionTokenParser;
}
