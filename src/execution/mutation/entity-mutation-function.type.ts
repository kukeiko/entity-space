import { EntityBlueprint } from "@entity-space/elements";
import { MaybeAsync } from "@entity-space/utils";
import { EntityMutationContext } from "./structures/entity-mutation-context";

/*
 * Contract for batch mutators (create, update, save and delete):
 * - Return only the entities that were persisted (deletes return nothing). Returned entities are matched to the
 *   received ones by Id, otherwise by the smallest difference of their properties, so the order does not matter.
 * - Call context.fail(receivedEntity, error, { path? }) for every received entity (including nested ones) that was not
 *   persisted. Received entities that are neither returned nor reported as failed are considered failed.
 * - Use context.succeed(receivedEntity, persisted?) to explicitly pair a received entity with its persisted
 *   representation if matching by properties could be ambiguous.
 * - Throwing (or rejecting) means that none of the received entities were persisted.
 *
 * One-entity mutators report a thrown error as failure of the received entity.
 */

export type CreateEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Type<B>;
    selection: S;
    context: EntityMutationContext;
}) => MaybeAsync<EntityBlueprint.Type<B>>;

export type CreateEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Type<B>[];
    selection: S;
    context: EntityMutationContext;
}) => MaybeAsync<EntityBlueprint.Type<B>[]>;

export type UpdateEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Type<B>;
    selection: S;
    context: EntityMutationContext;
}) => MaybeAsync<EntityBlueprint.Type<B>>;

export type UpdateEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Type<B>[];
    selection: S;
    context: EntityMutationContext;
}) => MaybeAsync<EntityBlueprint.Type<B>[]>;

export type SaveEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Type<B>;
    selection: S;
    context: EntityMutationContext;
}) => MaybeAsync<EntityBlueprint.Type<B>>;

export type SaveEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Type<B>[];
    selection: S;
    context: EntityMutationContext;
}) => MaybeAsync<EntityBlueprint.Type<B>[]>;

export type DeleteEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Type<B>;
    selection: S;
    context: EntityMutationContext;
}) => MaybeAsync<void>;

export type DeleteEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Type<B>[];
    selection: S;
    context: EntityMutationContext;
}) => MaybeAsync<void>;
