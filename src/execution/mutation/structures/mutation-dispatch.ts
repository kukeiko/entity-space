import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityMutationOptions } from "../../execution-arguments.interface";
import { CommittedEntities } from "../committed-entities";
import { TemporaryIds } from "../temporary-ids";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { ChangeItem } from "./change-item";
import { EntityMutation } from "./entity-mutation";

// [review] 🤖 for the status field, use enum-like object instead (such as EntityChangeType)
export type EntityChangeOutcome = { status: "succeeded" } | { status: "failed"; error: unknown; path?: string };

// [review] 🤖 for the type field, use enum-like object instead (such as EntityChangeType)
export type MutationCacheOperation =
    | { type: "upsert"; schema: EntitySchema; entity: Entity; selection: EntityRelationSelection }
    | { type: "delete"; schema: EntitySchema; entities: Entity[]; selection: EntityRelationSelection };

/**
 * Everything needed to dispatch (part of) an accepted mutation to its mutator.
 */
export interface MutationDispatch {
    readonly mutation: AcceptedEntityMutation;
    /** The root entities to dispatch, i.e. the accepted roots that are not blocked. */
    readonly roots: readonly Entity[];
    /** The items that are dispatched together with the roots. */
    readonly items: readonly ChangeItem[];
    /** Maps each dispatched item to the root entity it is dispatched with. */
    readonly rootOf: ReadonlyMap<ChangeItem, Entity>;
    readonly entityMutation: EntityMutation;
    readonly options: EntityMutationOptions;
    readonly signal: AbortSignal;
    readonly services: EntityServiceContainer;
    readonly temporaryIds: TemporaryIds;
    readonly committed: CommittedEntities;
    readonly cacheOperations: MutationCacheOperation[];
}
