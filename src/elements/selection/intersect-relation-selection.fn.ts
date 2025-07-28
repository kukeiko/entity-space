import { EntityRelationSelection } from "./entity-selection";

export function intersectRelationSelection(
    a: EntityRelationSelection,
    b: EntityRelationSelection,
): EntityRelationSelection {
    const intersection: EntityRelationSelection = {};

    for (const key in a) {
        const valueA = a[key];
        const valueB = b[key];

        if (valueB === undefined) {
            continue;
        } else {
            intersection[key] = intersectRelationSelection(valueA, valueB);
        }
    }

    return intersection;
}
