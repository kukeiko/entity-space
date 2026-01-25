import { copyEntity, Entity, getSelection } from "@entity-space/elements";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";

export function copyEntityForMutation(mutation: AcceptedEntityMutation, entity: Entity, isSave = false): Entity {
    const schema = mutation.getSchema();
    const selection = getSelection(schema, mutation.getSelection());

    return copyEntity(schema, entity, selection, (relation, entity) =>
        isSave ? true : relation.isEmbedded() || mutation.getChanges().some(change => change.getEntity() === entity),
    );
}
