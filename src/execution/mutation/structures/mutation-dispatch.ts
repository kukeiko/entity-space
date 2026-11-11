import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityMutationOptions } from "../../execution-arguments.interface";
import { CommittedEntities } from "../committed-entities";
import { TemporaryIds } from "../temporary-ids";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { PlannedEntityChange } from "./entity-change";
import { EntityMutation } from "./entity-mutation";

export const EntityChangeOutcomeStatus = {
    Succeeded: "succeeded",
    Failed: "failed",
} as const;

export type EntityChangeOutcome =
    | { status: typeof EntityChangeOutcomeStatus.Succeeded }
    | { status: typeof EntityChangeOutcomeStatus.Failed; error: unknown; path?: string };

export const MutationCacheOperationType = {
    Upsert: "upsert",
    Delete: "delete",
} as const;

export type MutationCacheOperation =
    | {
          type: typeof MutationCacheOperationType.Upsert;
          schema: EntitySchema;
          entity: Entity;
          selection: EntityRelationSelection;
      }
    | {
          type: typeof MutationCacheOperationType.Delete;
          schema: EntitySchema;
          entities: Entity[];
          selection: EntityRelationSelection;
      };

/**
 * Everything needed to dispatch (part of) an accepted mutation to its mutator.
 */
export interface MutationDispatch {
    readonly mutation: AcceptedEntityMutation;
    /** The root entities to dispatch, i.e. the accepted roots that are not blocked. */
    readonly roots: readonly Entity[];
    /** The items that are dispatched together with the roots. */
    readonly items: readonly PlannedEntityChange[];
    /** Maps each dispatched item to the root entity it is dispatched with. */
    readonly rootOf: ReadonlyMap<PlannedEntityChange, Entity>;
    readonly entityMutation: EntityMutation;
    readonly options: EntityMutationOptions;
    readonly signal: AbortSignal;
    readonly services: EntityServiceContainer;
    readonly temporaryIds: TemporaryIds;
    readonly committed: CommittedEntities;
    readonly cacheOperations: MutationCacheOperation[];
}
