import { EntitySchema } from "@entity-space/schema";
import { EntitySelection } from "./entity-selection.mjs";

export function omitRelationalSelections(
    selection: EntitySelection,
    schema: EntitySchema,
): EntitySelection | undefined {
    const omitted: EntitySelection = {};

    for (const [key, value] of Object.entries(selection)) {
        if (!schema.isRelation(key)) {
            omitted[key] = value;
        } else if (!schema.getRelation(key).isEmbedded()) {
            continue;
        } else if (value === true) {
            omitted[key] = value;
        } else {
            const omittedSelection = omitRelationalSelections(value, schema.getRelation(key).getRelatedSchema());

            if (omittedSelection) {
                omitted[key] = omittedSelection;
            }
        }
    }

    return Object.keys(omitted).length ? omitted : undefined;
}
