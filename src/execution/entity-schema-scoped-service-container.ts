import {
    CriterionShape,
    EntityBlueprint,
    EntityQueryShape,
    EntitySchema,
    EntitySelection,
    getDefaultSelection,
    mergeSelection,
    PackedEntitySelection,
    packEntitySelection,
    toRelationSelection,
    unpackSelection,
    WhereEntityShape,
    WhereEntityShapeInstance,
    whereEntityShapeToCriterionShape,
} from "@entity-space/elements";
import { Class, unwrapMaybeAsync } from "@entity-space/utils";
import { EntityQueryExecutionContext } from "./entity-query-execution-context";
import { EntityServiceContainer } from "./entity-service-container";
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
        load: LoadEntitiesFn<
            EntityBlueprint.Instance<B>,
            WhereEntityShapeInstance<W, EntityBlueprint.Instance<B>>,
            S,
            EntityBlueprint.Instance<P>
        >;
    }): this {
        const criterionShape: CriterionShape | undefined =
            where === undefined ? undefined : whereEntityShapeToCriterionShape(this.#schema, where);

        const queryShape = new EntityQueryShape(
            this.#schema,
            mergeSelection(getDefaultSelection(this.#schema), (select ?? {}) as EntitySelection),
            criterionShape,
            parameters ? this.#services.getCatalog().getSchemaByBlueprint(parameters) : undefined,
        );

        this.#addSourceFn(new EntitySource(this.#services.getTracing(), queryShape, load as LoadEntitiesFn, where));

        return this;
    }

    addHydrator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        hydrate,
        requires,
        select,
    }: {
        select: PackedEntitySelection<EntityBlueprint.Instance<B>>;
        requires: S;
        hydrate: (
            // [todo] ❌ similar to LoadEntitiesFunction, add a HydrateEntitiesFunction type and make it a singular argument for improved DX
            entities: EntityBlueprint.Instance<B>[],
            selection: PackedEntitySelection<EntityBlueprint.Instance<B>>,
            context: EntityQueryExecutionContext,
        ) => void | Promise<void>;
    }): this {
        this.#addHydratorFn(
            new ExplicitEntityHydrator(
                this.#schema,
                requires as EntitySelection,
                select as EntitySelection,
                async (entities, selection, context) => {
                    await hydrate(
                        entities as EntityBlueprint.Instance<B>[],
                        selection as PackedEntitySelection<EntityBlueprint.Instance<B>>,
                        context,
                    );
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
                        save({ entity: entity as EntityBlueprint.Savable<B>, selection: selection as S }),
                    );
                }),
            );
        };

        return this.#addMutator("save", mutate, select);
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

        return this.#addMutator("save", mutate, select);
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
                        create({ entity: entity as EntityBlueprint.Creatable<B>, selection: selection as S }),
                    );
                }),
            );
        };

        return this.#addMutator("create", mutate, select);
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
                create({ entities: entities as EntityBlueprint.Creatable<B>[], selection: selection as S }),
            );
        };

        return this.#addMutator("create", mutate, select);
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
                        update({ entity: entity as EntityBlueprint.Updatable<B>, selection: selection as S }),
                    );
                }),
            );
        };

        return this.#addMutator("update", mutate, select);
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
                update({ entities: entities as EntityBlueprint.Updatable<B>[], selection: selection as S }),
            );
        };

        return this.#addMutator("update", mutate, select);
    }

    addDeleteOneMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        delete: del,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        delete: DeleteEntityFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = (entities, selection) => {
            return Promise.all(
                entities.map(entity => {
                    return unwrapMaybeAsync(
                        del({ entity: entity as EntityBlueprint.Instance<B>, selection: selection as S }),
                    );
                }),
            );
        };

        return this.#addMutator("delete", mutate, select);
    }

    addDeleteMutator<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>({
        delete: del,
        select,
    }: {
        select?: S | PackedEntitySelection<EntityBlueprint.Instance<B>>;
        delete: DeleteEntitiesFn<B, S>;
    }): this {
        const mutate: EntityMutationFn = (entities, selection) => {
            return unwrapMaybeAsync(
                del({ entities: entities as EntityBlueprint.Instance<B>[], selection: selection as S }),
            );
        };

        return this.#addMutator("delete", mutate, select);
    }

    #addMutator(
        type: EntityMutationType,
        mutate: EntityMutationFn,
        select?: PackedEntitySelection<EntityBlueprint.Instance<B>>,
    ): this {
        const selection = select ? toRelationSelection(this.#schema, unpackSelection(this.#schema, select)) : undefined;
        const mutator = new ExplicitEntityMutator(type, this.#schema, mutate, selection);
        this.#addMutatorFn(mutator);

        return this;
    }
}
