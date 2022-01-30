import { NamedCriteriaTemplate, NamedCriteriaTemplateItems } from "./named-criteria-template";

// [todo] user can't have autocomplete, e.g. matchesTemplate<Product>({...}) would be nice
export function matchesTemplate<T extends NamedCriteriaTemplateItems, U extends NamedCriteriaTemplateItems = {}>(
    required: T,
    optional?: U
): NamedCriteriaTemplate<T, U> {
    return new NamedCriteriaTemplate(required, optional);
}
