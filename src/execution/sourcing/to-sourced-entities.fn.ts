import { Entity, EntitySchema, EntitySelection, getHydratedSelection, subtractSelection } from "@entity-space/elements";
import { SourcedEntities } from "./sourced-entities";

export function toSourcedEntities(
    schema: EntitySchema,
    entities: Entity[],
    targetSelection: EntitySelection,
): SourcedEntities {
    const availableSelection = getHydratedSelection(schema, entities);
    const openSelection = subtractSelection(targetSelection, availableSelection);

    if (openSelection === true) {
        return new SourcedEntities(schema, targetSelection, availableSelection);
    } else if (openSelection === false) {
        return new SourcedEntities(schema, targetSelection, availableSelection, targetSelection);
    } else {
        return new SourcedEntities(schema, targetSelection, availableSelection, openSelection);
    }
}
