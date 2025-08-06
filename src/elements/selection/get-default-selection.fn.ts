import { isEntityPrimitiveProperty } from "../entity/entity-primitive-property";
import { EntityProperty } from "../entity/entity-property";
import { isEntityRelationProperty } from "../entity/entity-relation-property";
import { EntitySchema } from "../entity/entity-schema";
import { EntityRelationSelection, EntitySelection } from "./entity-selection";

function getDefaultSelectionCore(
    schema: EntitySchema,
    predicate: (property: EntityProperty) => boolean,
    visited: Map<EntitySchema, EntitySelection>,
    relations: EntityRelationSelection,
): EntitySelection {
    const selection: EntitySelection = {};
    // [todo] ❌ now that we only support recursion to reference its direct parent, we should change this
    // (also in all other selection fns where applicable, e.g. mergeSelections() should not be changed still)
    visited.set(schema, selection);

    for (const property of schema.getProperties()) {
        const key = property.getName();

        if (property.isOptional() && !relations[key]) {
            continue;
        }

        if (isEntityPrimitiveProperty(property) && predicate(property)) {
            selection[key] = true;
        } else if (isEntityRelationProperty(property) && predicate(property)) {
            const relatedSchema = property.getRelatedSchema();

            if (
                relatedSchema.getName() === schema.getName() &&
                (!Object.keys(relations).length || relations[key] === relations)
            ) {
                selection[key] = selection;
            } else {
                selection[key] = getDefaultSelectionCore(relatedSchema, predicate, visited, relations[key] ?? {});
            }
        }
    }

    return selection;
}

export function getDefaultSelection(
    schema: EntitySchema,
    predicate?: (property: EntityProperty) => boolean,
    relations?: EntityRelationSelection,
): EntitySelection {
    return getDefaultSelectionCore(schema, predicate ?? (() => true), new Map(), relations ?? {});
}
