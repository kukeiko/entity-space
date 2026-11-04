import { EntityChanges } from "../entity-changes";
import { EntityChangesBuilder } from "../entity-changes-builder";
import { EntityMutation } from "../entity-mutation";
import { addChangeRelations } from "./add-change-relations.fn";
import { addEntityChanges } from "./add-entity-changes.fn";

export function toEntityChanges(mutation: EntityMutation): EntityChanges | undefined {
    const schema = mutation.getSchema();
    const entities = mutation.getEntities();
    const selection = mutation.getSelection() ?? {};
    const previous = mutation.getPrevious();
    const builder = new EntityChangesBuilder();

    addChangeRelations(builder, schema, selection, entities);

    if (previous !== undefined) {
        addChangeRelations(builder, schema, selection, previous);
    }

    addEntityChanges(builder, mutation);
    const changes = builder.buildChanges();

    if (!changes.length) {
        return undefined;
    }

    return new EntityChanges(schema, selection, changes, entities, previous);
}
