import { NamedCriteriaBagTemplate } from "../criterion-template.types";
import { NamedCriteriaTemplate } from "./named-criteria-template";

export function matchesTemplate<T extends NamedCriteriaBagTemplate = NamedCriteriaBagTemplate>(
    items: T
): NamedCriteriaTemplate<T> {
    return new NamedCriteriaTemplate(items);
}
