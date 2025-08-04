import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { EntityChanges } from "./entity-changes";

export type EntityMutationFn = (entities: Entity[], selection: EntityRelationSelection) => Promise<Entity[]>;

export abstract class EntityMutator {
    abstract accept(
        schema: EntitySchema,
        entities: readonly Entity[],
        changes: EntityChanges,
        selection: EntityRelationSelection,
        previous?: readonly Entity[],
    ): [accepted: AcceptedEntityMutation | undefined, open: EntityChanges | undefined];

    abstract mutate(mutation: AcceptedEntityMutation): Promise<void>;
}
