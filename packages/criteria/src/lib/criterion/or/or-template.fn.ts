import { CriterionTemplate } from "../criterion-template.types";
import { OrCriteriaTemplate } from "./or-criteria-template";

export function orTemplate<T extends CriterionTemplate[]>(items: T): OrCriteriaTemplate<T> {
    return new OrCriteriaTemplate(items);
}
