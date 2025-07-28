import { EntityBlueprint } from "@entity-space/elements";
import { SyncOrAsyncValue } from "@entity-space/utils";

export type CreateEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Creatable<B>;
    selection: S;
}) => SyncOrAsyncValue<EntityBlueprint.Instance<B>>;

export type CreateEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Creatable<B>[];
    selection: S;
}) => SyncOrAsyncValue<EntityBlueprint.Instance<B>[]>;

export type UpdateEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Updatable<B>;
    selection: S;
}) => SyncOrAsyncValue<EntityBlueprint.Instance<B>>;

export type UpdateEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Updatable<B>[];
    selection: S;
}) => SyncOrAsyncValue<EntityBlueprint.Instance<B>[]>;

export type SaveEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Savable<B>;
    selection: S;
}) => SyncOrAsyncValue<EntityBlueprint.Instance<B>>;

export type SaveEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Savable<B>[];
    selection: S;
}) => SyncOrAsyncValue<EntityBlueprint.Instance<B>[]>;

export type DeleteEntityFn<B, S = {}> = (args: {
    entity: EntityBlueprint.Instance<B>;
    selection: S;
}) => SyncOrAsyncValue<EntityBlueprint.Instance<B>>;

export type DeleteEntitiesFn<B, S = {}> = (args: {
    entities: EntityBlueprint.Instance<B>[];
    selection: S;
}) => SyncOrAsyncValue<EntityBlueprint.Instance<B>[]>;
