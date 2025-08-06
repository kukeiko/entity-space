import { EntityRelationSelection } from "./entity-selection";

function intersectRelationSelectionCore(
    a: EntityRelationSelection,
    b: EntityRelationSelection,
    visited: Map<EntityRelationSelection, [EntityRelationSelection, EntityRelationSelection]> = new Map(),
): EntityRelationSelection {
    const intersection: EntityRelationSelection = {};
    visited.set(a, [b, intersection]);

    for (const key in a) {
        const valueA = a[key];
        const valueB = b[key];

        if (valueB === undefined) {
            continue;
        } else {
            if (visited.get(valueA)?.[0] === valueB) {
                intersection[key] = visited.get(valueA)![1];
            } else {
                intersection[key] = intersectRelationSelection(valueA, valueB);
            }
        }
    }

    return intersection;
}

export function intersectRelationSelection(
    a: EntityRelationSelection,
    b: EntityRelationSelection,
): EntityRelationSelection {
    const intersected = intersectRelationSelectionCore(a, b);
    // [todo] ❌ figure out why this needs to be commented out and write a test for it
    // omitEmptySelections(intersected);

    return intersected;
}
