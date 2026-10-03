import { Entity, EntityRelationSelection } from "@entity-space/elements";
import { Path } from "@entity-space/utils";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { EntityChanges } from "./entity-changes";
import { EntityMutationContext } from "./structures/entity-mutation-context";

export type EntityMutationFn = (
    entities: Entity[],
    selection: EntityRelationSelection,
    context: EntityMutationContext,
) => Promise<Entity[]>;

export abstract class EntityMutator {
    abstract accept(
        changes: EntityChanges,
        path?: Path,
    ): [accepted: AcceptedEntityMutation | undefined, open: EntityChanges | undefined];
}
