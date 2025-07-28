import { Path, toPath, toPathSegments } from "@entity-space/utils";
import { EntitySelection } from "./entity-selection";

function getOpenRelationSelectionsCore(
    required: EntitySelection,
    supported: EntitySelection,
    path?: Path,
): [Path, EntitySelection][] {
    const openRelationSelections: [Path, EntitySelection][] = [];

    for (const [key, value] of Object.entries(required)) {
        if (value === true) {
            continue;
        }

        const thisPath = path ? toPath([...toPathSegments(path), key].join(".")) : toPath(key);

        if (supported[key] === undefined) {
            openRelationSelections.push([thisPath, value]);
        } else if (supported[key] !== true) {
            openRelationSelections.push(...getOpenRelationSelectionsCore(value, supported[key], thisPath));
        }
    }

    return openRelationSelections;
}

export function getOpenRelationSelections(
    required: EntitySelection,
    supported: EntitySelection,
): [Path, EntitySelection][] {
    return getOpenRelationSelectionsCore(required, supported);
}
