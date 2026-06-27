import { EntitySchema } from "../entity/entity-schema";
import { EntitySelection } from "./entity-selection";

export function omitJoinedSelections(selection: EntitySelection, schema: EntitySchema): EntitySelection | undefined {
    const kept: EntitySelection = {};

    for (const [key, value] of Object.entries(selection)) {
        if (schema.isRelation(key)) {
            if (schema.getRelation(key).isJoined()) {
                continue;
            } else if (value === true) {
                kept[key] = true;
            } else {
                const nested = omitJoinedSelections(value, schema.getRelation(key).getRelatedSchema());

                if (nested) {
                    kept[key] = nested;
                }
            }
        } else {
            kept[key] = value;
        }
    }

    return Object.keys(kept).length ? kept : undefined;
}
