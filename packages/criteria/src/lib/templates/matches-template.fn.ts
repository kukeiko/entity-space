import { NamedCriteriaTemplate, NamedCriteriaTemplateItems } from "./named-criteria-template";

export function matchesTemplate<T extends NamedCriteriaTemplateItems>(items: T): NamedCriteriaTemplate<T> {
    return new NamedCriteriaTemplate(items);
}
