import { allCriterionTokenParser } from "./all-criterion.token-parser";
import { criteriaTokenParser } from "./criteria.token-parser";
import { CriterionTokenParser } from "./criterion-token-parser.type";
import { inRangeCriterionTokenParser } from "./in-range-criterion.token-parser";
import { namedCriteriaTokenParser } from "./entity-criteria.token-parser";
import { setCriterionTokenParser } from "./in-array-criterion.token-parser";
import { tokenParser } from "./token-parser";
import { valueCriterionTokenParser } from "./value-criterion.token-parser";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";

export function criterionTokenParser(factory: IEntityCriteriaFactory): CriterionTokenParser {
    return tokenParser([
        () => criteriaTokenParser(factory),
        () => inRangeCriterionTokenParser(factory),
        () => setCriterionTokenParser(factory),
        () => namedCriteriaTokenParser(factory),
        () => valueCriterionTokenParser(factory),
        () => allCriterionTokenParser(factory),
    ]) as CriterionTokenParser;
}
