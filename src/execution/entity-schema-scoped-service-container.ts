import {
    CriterionShape,
    EntityBlueprint,
    EntityQueryShape,
    EntitySchema,
    EntitySelection,
    getDefaultSelection,
    isRequiredCreatableEntityProperty,
    isUpdatableEntityProperty,
    mergeSelection,
    PackedEntitySelection,
    TypedEntitySelection,
    unpackSelection,
    WhereEntityShape,
    WhereEntityShapeInstance,
    whereEntityShapeToCriterionShape,
} from "@entity-space/elements";
import { Class } from "@entity-space/utils";
import { EntityQueryExecutionContext } from "./entity-query-execution-context";
import { EntityServiceContainer } from "./entity-service-container";
import { ExplicitEntityHydrator } from "./hydration/explicit-entity-hydrator";
import { EntityMutator } from "./mutation/entity-mutator";
import { CreateEntitiesFn, CreateEntityFn, DeleteEntityFn, UpdateEntityFn } from "./mutation/mutation-function.type";
import { EntitySource, LoadEntitiesFunction } from "./sourcing/entity-source";

export class EntitySchemaScopedServiceContainer<B> {
    constructor(
        services: EntityServiceContainer,
        schema: EntitySchema,
        addSourceFn: (source: EntitySource) => void,
        addHydratorFn: (hydrator: ExplicitEntityHydrator) => void,
        addMutatorFn: (mutator: EntityMutator) => void,
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
    readonly #addMutatorFn: (mutator: EntityMutator) => void;

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
        load: LoadEntitiesFunction<
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

        this.#addSourceFn(
            new EntitySource(this.#services.getTracing(), queryShape, load as LoadEntitiesFunction, where),
        );

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
            // [todo] similar to LoadEntitiesFunction, add a HydrateEntitiesFunction type and make it a singular argument for improved DX
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

    addCreateOneMutator({
        create,
        select,
    }: {
        select?: PackedEntitySelection<EntityBlueprint.Instance<B>>;
        create: CreateEntityFn<B>;
    }): this {
        const selection = unpackSelection(this.#schema, select ?? {}, isRequiredCreatableEntityProperty);
        const mutator = new EntityMutator(this.#schema, "create", selection, async (entities, selection) => {
            const created = await create({
                entity: entities[0] as EntityBlueprint.Creatable<B>,
                selection: selection as TypedEntitySelection<EntityBlueprint.Instance<B>>,
            });

            return [created];
        });

        this.#addMutatorFn(mutator);

        return this;
    }

    addCreateMutator({
        create,
        select,
    }: {
        select?: PackedEntitySelection<EntityBlueprint.Instance<B>>;
        create: CreateEntitiesFn<B>;
    }): this {
        // [todo] might need to unpackSelection() - but with a predicate to only include properties that are required for creation
        const mutator = new EntityMutator(this.#schema, "create", {}, (entities, selection) =>
            create({
                entities: entities as EntityBlueprint.Creatable<B>[],
                selection: selection as TypedEntitySelection<EntityBlueprint.Instance<B>>,
            }),
        );

        this.#addMutatorFn(mutator);

        return this;
    }

    addUpdateOneMutator({
        update,
        select,
    }: {
        select?: PackedEntitySelection<EntityBlueprint.Instance<B>>;
        update: UpdateEntityFn<B>;
    }): this {
        const selection = unpackSelection(this.#schema, select ?? {}, isUpdatableEntityProperty);
        const mutator = new EntityMutator(this.#schema, "update", selection, async (entities, selection) => {
            const updated = await update({
                entity: entities[0] as EntityBlueprint.Updatable<B>,
            });

            return [updated];
        });

        this.#addMutatorFn(mutator);

        return this;
    }

    addDeleteOneMutator({ delete: deleteFn }: { delete: DeleteEntityFn<B> }): this {
        const mutator = new EntityMutator(this.#schema, "delete", getDefaultSelection(this.#schema), async entities => {
            await deleteFn({
                entity: entities[0] as EntityBlueprint.Instance<B>,
            });

            return [];
        });

        this.#addMutatorFn(mutator);

        return this;
    }
}
