import { joinPaths, Path, toPath } from "@entity-space/utils";
import { EntitySelection } from "./entity-selection";
import { isRecursiveSelection } from "./is-recursive-selection.fn";

export function selectionToPaths(selection: EntitySelection, path?: Path): Path[] {
    if (isRecursiveSelection(selection)) {
        throw new Error("recursive selections are not supported");
    }

    const paths: Path[] = [];

    for (const [key, value] of Object.entries(selection)) {
        if (typeof value === "boolean") {
            if (path !== undefined) {
                paths.push(joinPaths([path, key]));
            } else {
                paths.push(toPath(key));
            }
        } else {
            paths.push(...selectionToPaths(value, joinPaths([path, key])));
        }
    }

    return paths;
}
