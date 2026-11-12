import { EntityChangesBuilder } from "../entity-changes-builder";
import { CommittedEntities } from "../structures/committed-entities";
import { EntityChanges } from "../structures/entity-changes";
import { EntityMutation } from "../structures/entity-mutation";
import { addChangeRelations } from "./add-change-relations.fn";
import { addEntityChanges } from "./add-entity-changes.fn";

export function toEntityChanges(mutation: EntityMutation, committed?: CommittedEntities): EntityChanges | undefined {
    const schema = mutation.getSchema();
    const entities = mutation.getEntities();
    const selection = mutation.getSelection() ?? {};
    const previous = mutation.getPrevious();
    const builder = new EntityChangesBuilder(committed);

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
