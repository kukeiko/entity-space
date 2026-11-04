import { Entity, EntityRelationSelection } from "@entity-space/elements";
import { Path } from "@entity-space/utils";
import { AcceptedEntityMutation } from "./structures/accepted-entity-mutation";
import { EntityChanges } from "./structures/entity-changes";
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

export const EntityMutatorType = {
    Create: "create",
    Update: "update",
    Delete: "delete",
    Save: "save",
} as const;

export type EntityMutatorType = (typeof EntityMutatorType)[keyof typeof EntityMutatorType];
