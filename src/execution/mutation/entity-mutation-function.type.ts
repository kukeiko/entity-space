import { EntityBlueprint } from "@entity-space/elements";
import { MaybeAsync } from "@entity-space/utils";

export type CreateEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Type<B>;
    selection: S;
}) => MaybeAsync<EntityBlueprint.Type<B>>;

export type CreateEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Type<B>[];
    selection: S;
}) => MaybeAsync<EntityBlueprint.Type<B>[]>;

export type UpdateEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Type<B>;
    selection: S;
}) => MaybeAsync<EntityBlueprint.Type<B>>;

export type UpdateEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Type<B>[];
    selection: S;
}) => MaybeAsync<EntityBlueprint.Type<B>[]>;

export type SaveEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Type<B>;
    selection: S;
}) => MaybeAsync<EntityBlueprint.Type<B>>;

export type SaveEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Type<B>[];
    selection: S;
}) => MaybeAsync<EntityBlueprint.Type<B>[]>;

export type DeleteEntityFn<B, S = {}> = (args: { entity: EntityBlueprint.Type<B>; selection: S }) => MaybeAsync<void>;

export type DeleteEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Type<B>[];
    selection: S;
}) => MaybeAsync<void>;
