import { NamedCriteriaShape, NamedCriteriaShapeItems } from "./named-criteria-shape";

// [todo] user can't have autocomplete, e.g. matchesTemplate<Product>({...}) would be nice
export function namedShape<T extends NamedCriteriaShapeItems, U extends NamedCriteriaShapeItems = {}>(
    required: T,
    optional?: U
): NamedCriteriaShape<T, U> {
    return new NamedCriteriaShape(required, optional);
}
