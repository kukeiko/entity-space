import { copyEntities, Entity, EntityRelationProperty, getSelection } from "@entity-space/elements";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { DispatchedCopies, mapDispatchedCopies } from "./map-dispatched-copies.fn";

export interface CopiesForMutationDispatch extends DispatchedCopies {
    readonly copies: Entity[];
}

export function copyEntitiesForMutationDispatch(
    mutation: AcceptedEntityMutation,
    entities: readonly Entity[],
    isSave = false,
): CopiesForMutationDispatch {
    const schema = mutation.getSchema();
    const selection = getSelection(schema, mutation.getSelection());
    const predicate = (relation: EntityRelationProperty, entity: Entity) =>
        isSave || relation.isEmbedded() || mutation.includesEntity(entity);
    const copies = copyEntities(schema, entities, selection, predicate);

    return { copies, ...mapDispatchedCopies(schema, selection, copies, entities, predicate) };
}
