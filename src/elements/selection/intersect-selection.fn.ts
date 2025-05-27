import { EntitySelection } from "./entity-selection";

export function intersectSelection(a: EntitySelection, b: EntitySelection): EntitySelection | false {
    const intersection: EntitySelection = {};

    for (const key in a) {
        const valueA = a[key];
        const valueB = b[key];

        if (valueB === undefined) {
            continue;
        } else if (typeof valueA !== typeof valueB) {
            throw new Error(`intersection between incompatible selections on key ${key}`);
        } else if (valueA === true && valueB === true) {
            intersection[key] = true;
        } else {
            const nestedIntersection = intersectSelection(valueA as EntitySelection, valueB as EntitySelection);

            if (nestedIntersection) {
                intersection[key] = nestedIntersection;
            }
        }
    }

    return Object.keys(intersection).length ? intersection : false;
}
