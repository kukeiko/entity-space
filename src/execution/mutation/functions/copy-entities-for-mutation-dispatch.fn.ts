import { Entity } from "@entity-space/elements";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { copyEntityForMutationDispatch } from "./copy-entity-for-mutation-dispatch.fn";

export function copyEntitiesForMutationDispatch(
    mutation: AcceptedEntityMutation,
    entities: readonly Entity[],
    isSave = false,
): [Entity[], Entity[]] {
    const map = new Map(
        entities.map(entity => {
            const copy = copyEntityForMutationDispatch(mutation, entity, isSave);

            return [copy, entity];
        }),
    );

    return [[...map.keys()], [...map.values()]];
}
