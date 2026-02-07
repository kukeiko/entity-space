import { EntityChanges } from "../entity-changes";
import { EntityChangesBuilder } from "../entity-changes-builder";
import { EntityMutation, EntityMutationType } from "../entity-mutation";
import { addChangeRelations } from "./add-change-relations.fn";
import { addEntityChanges } from "./add-entity-changes.fn";

export function toEntityChanges(mutation: EntityMutation): EntityChanges | undefined {
    const schema = mutation.getSchema();
    const entities = mutation.getEntities();
    const selection = mutation.getSelection() ?? {};
    const previous = mutation.getPrevious();
    const type: EntityMutationType[] =
        mutation.getType() === "save" ? ["create", "update", "delete"] : [mutation.getType()];

    const builder = new EntityChangesBuilder();
    addChangeRelations(builder, schema, selection, entities);

    if (previous !== undefined) {
        addChangeRelations(builder, schema, selection, previous);
    }

    addEntityChanges(builder, schema, selection, entities, type, previous);
    const changes = builder.buildChanges();

    if (!changes.length) {
        return undefined;
    }

    return new EntityChanges(schema, selection, changes, entities, previous);
}
