import { EntityBlueprint, TypedEntitySelection } from "@entity-space/elements";

export type CreateEntityFn<B> = (args: {
    entity: EntityBlueprint.Creatable<B>;
    selection: TypedEntitySelection<EntityBlueprint.Creatable<B>>;
}) => Promise<EntityBlueprint.Instance<B>>;

export type CreateEntitiesFn<B> = (args: {
    entities: readonly EntityBlueprint.Creatable<B>[];
    selection: TypedEntitySelection<EntityBlueprint.Creatable<B>>;
}) => Promise<EntityBlueprint.Instance<B>[]>;

export type UpdateEntityFn<B> = (args: {
    entity: EntityBlueprint.Updatable<B>;
}) => Promise<EntityBlueprint.Instance<B>>;

export type UpdateEntitiesFn<B> = (args: {
    entities: readonly EntityBlueprint.Updatable<B>[];
}) => Promise<EntityBlueprint.Instance<B>[]>;

export type DeleteEntityFn<B> = (args: { entity: EntityBlueprint.Instance<B> }) => Promise<void>;

export type DeleteEntitiesFn<B> = (args: { entities: readonly EntityBlueprint.Instance<B>[] }) => Promise<void>;
