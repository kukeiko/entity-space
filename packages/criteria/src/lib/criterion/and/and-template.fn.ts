import { CriterionTemplate } from "../criterion-template.types";
import { AndCriteriaTemplate } from "./and-criteria-template";

export function andTemplate<T extends CriterionTemplate[]>(items: T): AndCriteriaTemplate<T> {
    return new AndCriteriaTemplate(items);
}
