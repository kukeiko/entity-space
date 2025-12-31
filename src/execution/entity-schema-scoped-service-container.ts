import {
    CriterionShape,
    EntityBlueprint,
    EntityQueryShape,
    EntityRelationSelection,
    EntitySchema,
    getDefaultSelection,
    isCreatableEntityProperty,
    isSavableEntityProperty,
    isUpdatableEntityProperty,
    mergeSelection,
    PackedEntitySelection,
    packEntitySelection,
    SelectEntity,
    toRelationSelection,
    unpackSelection,
    unpackSelectionWithoutDefault,
    WhereEntityShape,
    whereEntityShapeToCriterionShape,
} from "@entity-space/elements";
import { Class, unwrapMaybeAsync } from "@entity-space/utils";
import { EntityServiceContainer } from "./entity-service-container";
import { HydrateEntitiesFn } from "./hydration/entity-hydrator";
import { ExplicitEntityHydrator } from "./hydration/explicit-entity-hydrator";
import { EntityMutationType } from "./mutation/entity-mutation";
import {
    CreateEntitiesFn,
    CreateEntityFn,
    DeleteEntitiesFn,
    DeleteEntityFn,
    SaveEntitiesFn,
    SaveEntityFn,
    UpdateEntitiesFn,
    UpdateEntityFn,
} from "./mutation/entity-mutation-function.type";
import { EntityMutationFn } from "./mutation/entity-mutator";
import { ExplicitEntityMutator } from "./mutation/explicit-entity-mutator";
import { EntitySource, LoadEntitiesFn } from "./sourcing/entity-source";

export class EntitySchemaScopedServiceContainer<B> {
    constructor(
        services: EntityServiceContainer,
        schema: EntitySchema,
        addSourceFn: (source: EntitySource) => void,
        addHydratorFn: (hydrator: ExplicitEntityHydrator) => void,
        addMutatorFn: (mutator: ExplicitEntityMutator) => void,
    ) {
        this.#services = services;
        this.#schema = schema;
        this.#addSourceFn = addSourceFn;
        this.#addHydratorFn = addHydratorFn;
        this.#addMutatorFn = addMutatorFn;
    }

    readonly #services: EntityServiceContainer;
    readonly #schema: EntitySchema;
    readonly #addSourceFn: (source: EntitySource) => void;
    readonly #addHydratorFn: (hydrator: ExplicitEntityHydrator) => void;
    readonly #addMutatorFn: (mutator: ExplicitEntityMutator) => void;

    addSource<
        W extends WhereEntityShape<EntityBlueprint.Instance<B>>,
        S extends PackedEntitySelection<EntityBlueprint.Instance<B>>,
        P,
    >({
        where,
        select,
        load,
        parameters,
    }: {
        where?: W | WhereEntityShape<EntityBlueprint.Instance<B>>;
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        parameters?: Class<P>;
        load: LoadEntitiesFn<B, W, S, P>;
    }): this {
        const criterionShape: CriterionShape | undefined =
            where === undefined ? undefined : whereEntityShapeToCriterionShape(this.#schema, where);

        const queryShape = new EntityQueryShape(
            this.#schema,
            mergeSelection(getDefaultSelection(this.#schema), unpackSelection(this.#schema, select ?? {})),
            criterionShape,
            parameters ? this.#services.getCatalog().getSchemaByBlueprint(parameters) : undefined,
        );

        this.#addSourceFn(new EntitySource(this.#services.getTracing(), queryShape, load as LoadEntitiesFn, where));

        return this;
    }

    addHydrator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>, P>({
        hydrate,
        requires,
        select,
        parameters,
    }: {
        select: PackedEntitySelection<EntityBlueprint.Instance<B>>;
        requires: S;
        hydrate: HydrateEntitiesFn<B, S, P>;
        parameters?: Class<P>;
    }): this {
        const parametersSchema = parameters ? this.#services.getCatalog().getSchemaByBlueprint(parameters) : undefined;

        this.#addHydratorFn(
            new ExplicitEntityHydrator(
                this.#schema,
                parametersSchema,
                unpackSelectionWithoutDefault(this.#schema, requires),
                unpackSelectionWithoutDefault(this.#schema, select),
                async ({ entities, selection, context, parameters }) => {
                    await hydrate({
                        entities: entities as SelectEntity<EntityBlueprint.Instance<B>, S>[],
                        selection: selection as PackedEntitySelection<EntityBlueprint.Instance<B>>,
                        context,
                        parameters: (parameters ?? {}) as EntityBlueprint.Type<P>,
                    });
                },
            ),
        );
        return this;
    }

    addSaveOneMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        save,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        save: SaveEntityFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = (entities, selection) => {
            return Promise.all(
                entities.map(entity => {
                    return unwrapMaybeAsync(
                        save({
                            entity: entity as EntityBlueprint.Savable<B>,
                            selection: packEntitySelection(this.#schema, selection) as S,
                        }),
                    );
                }),
            );
        };

        const selection = toRelationSelection(
            this.#schema,
            unpackSelection(this.#schema, select ?? {}, isSavableEntityProperty),
        );

        return this.#addMutator("save", mutate, selection);
    }

    addSaveMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        save,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        save: SaveEntitiesFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = (entities, selection) => {
            return unwrapMaybeAsync(
                save({
                    entities: entities as EntityBlueprint.Savable<B>[],
                    selection: packEntitySelection(this.#schema, selection) as S,
                }),
            );
        };

        const selection = toRelationSelection(
            this.#schema,
            unpackSelection(this.#schema, select ?? {}, isSavableEntityProperty),
        );

        return this.#addMutator("save", mutate, selection);
    }

    addCreateOneMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        create,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        create: CreateEntityFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = (entities, selection) => {
            return Promise.all(
                entities.map(entity => {
                    return unwrapMaybeAsync(
                        create({
                            entity: entity as EntityBlueprint.Creatable<B>,
                            selection: packEntitySelection(this.#schema, selection) as S,
                        }),
                    );
                }),
            );
        };

        const selection = toRelationSelection(
            this.#schema,
            unpackSelection(this.#schema, select ?? {}, isCreatableEntityProperty),
        );

        return this.#addMutator("create", mutate, selection);
    }

    addCreateMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        create,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        create: CreateEntitiesFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = (entities, selection) => {
            return unwrapMaybeAsync(
                create({
                    entities: entities as EntityBlueprint.Creatable<B>[],
                    selection: packEntitySelection(this.#schema, selection) as S,
                }),
            );
        };

        const selection = toRelationSelection(
            this.#schema,
            unpackSelection(this.#schema, select ?? {}, isCreatableEntityProperty),
        );

        return this.#addMutator("create", mutate, selection);
    }

    addUpdateOneMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        update,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        update: UpdateEntityFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = (entities, selection) => {
            return Promise.all(
                entities.map(entity => {
                    return unwrapMaybeAsync(
                        update({
                            entity: entity as EntityBlueprint.Updatable<B>,
                            selection: packEntitySelection(this.#schema, selection) as S,
                        }),
                    );
                }),
            );
        };

        const selection = toRelationSelection(
            this.#schema,
            unpackSelection(this.#schema, select ?? {}, isUpdatableEntityProperty),
        );

        return this.#addMutator("update", mutate, selection);
    }

    addUpdateMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        update,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        update: UpdateEntitiesFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = (entities, selection) => {
            return unwrapMaybeAsync(
                update({
                    entities: entities as EntityBlueprint.Updatable<B>[],
                    selection: packEntitySelection(this.#schema, selection) as S,
                }),
            );
        };

        const selection = toRelationSelection(
            this.#schema,
            unpackSelection(this.#schema, select ?? {}, isUpdatableEntityProperty),
        );

        return this.#addMutator("update", mutate, selection);
    }

    addDeleteOneMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        delete: del,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        delete: DeleteEntityFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = async (entities, selection) => {
            await Promise.all(
                entities.map(entity => {
                    return unwrapMaybeAsync(
                        del({
                            entity: entity as EntityBlueprint.Instance<B>,
                            selection: packEntitySelection(this.#schema, selection) as S,
                        }),
                    );
                }),
            );

            return entities;
        };

        const selection = toRelationSelection(this.#schema, unpackSelection(this.#schema, select ?? {}));

        return this.#addMutator("delete", mutate, selection);
    }

    addDeleteMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        delete: del,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        delete: DeleteEntitiesFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = async (entities, selection) => {
            await unwrapMaybeAsync(
                del({
                    entities: entities as EntityBlueprint.Instance<B>[],
                    selection: packEntitySelection(this.#schema, selection) as S,
                }),
            );

            return entities;
        };

        const selection = toRelationSelection(this.#schema, unpackSelection(this.#schema, select ?? {}));

        return this.#addMutator("delete", mutate, selection);
    }

    #addMutator(type: EntityMutationType, mutate: EntityMutationFn, selection: EntityRelationSelection): this {
        const mutator = new ExplicitEntityMutator(this.#services.getTracing(), type, this.#schema, mutate, selection);
        this.#addMutatorFn(mutator);

        return this;
    }
}
