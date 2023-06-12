import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ClippedEntitySelection, IEntitySelectionTools } from "./entity-selection-tools.interface";

export class EntitySelectionTools implements IEntitySelectionTools {
    clip(what: UnpackedEntitySelection, by: UnpackedEntitySelection): ClippedEntitySelection[] {
        const clipInternal = (
            what: UnpackedEntitySelection,
            by: UnpackedEntitySelection,
            path: string[]
        ): ClippedEntitySelection[] => {
            const clipped: ClippedEntitySelection[] = [];

            for (const [key, value] of Object.entries(what)) {
                if (value === undefined) {
                    continue;
                }

                const other = by[key];

                if (other === undefined) {
                    clipped.push([[...path, key], value]);
                } else if (other !== true && value !== true) {
                    clipped.push(...clipInternal(value, other, [...path, key]));
                }
            }

            return clipped;
        };

        return clipInternal(what, by, []);
    }
}
