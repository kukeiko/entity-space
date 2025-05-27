import { EntitySelection } from "./entity-selection";

export function subtractSelection(what: EntitySelection, by: EntitySelection): EntitySelection | boolean {
    const subtracted: EntitySelection = {};
    let didSubtract = false;

    for (const key in what) {
        const valueWhat = what[key];
        const valueBy = by[key];

        if (valueBy === undefined) {
            subtracted[key] = valueWhat;
        } else if (typeof valueWhat !== typeof valueBy) {
            throw new Error(`subtraction between incompatible selections on key ${key}`);
        } else if (valueWhat !== true && valueBy !== true) {
            const nestedSubtracted = subtractSelection(valueWhat, valueBy);

            if (nestedSubtracted === false) {
                subtracted[key] = valueWhat;
            } else if (nestedSubtracted !== true) {
                subtracted[key] = nestedSubtracted;
                didSubtract = true;
            } else {
                didSubtract = true;
            }
        } else {
            didSubtract = true;
        }
    }

    if (!didSubtract) {
        return false;
    }

    return Object.keys(subtracted).length ? subtracted : true;
}
