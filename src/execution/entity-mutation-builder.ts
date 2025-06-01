import {
    EntityBlueprint,
    EntitySchema,
    entityToSelection,
    getDefaultSelection,
    intersectSelection,
    isRequiredCreatableEntityProperty,
    isUpdatableEntityProperty,
    PackedEntitySelection,
    unpackSelection,
} from "@entity-space/elements";
import { MutationOperation } from "./mutation/mutation-operation";

export class EntityMutationBuilder<B, S extends PackedEntitySelection<EntityBlueprint.Instance<B>> = {}> {
    constructor(
        schema: EntitySchema,
        mutateFn: (operation: MutationOperation) => Promise<EntityBlueprint.Instance<B>[]>,
    ) {
        this.#schema = schema;
        this.#mutateFn = mutateFn;
    }

    readonly #schema: EntitySchema;
    readonly #mutateFn: (operation: MutationOperation) => Promise<EntityBlueprint.Instance<B>[]>;
    #selection: PackedEntitySelection<EntityBlueprint.Instance<B>> = {};

    select<E extends PackedEntitySelection<EntityBlueprint.Instance<B>>>(
        select: E | PackedEntitySelection<EntityBlueprint.Instance<B>>,
    ): EntityMutationBuilder<B, E> {
        this.#selection = select;
        return this as any;
    }

    async createOne(entity: EntityBlueprint.Creatable<B>): Promise<EntityBlueprint.Instance<B>> {
        const selection = unpackSelection(this.#schema, this.#selection, isRequiredCreatableEntityProperty);
        const operation = new MutationOperation("create", this.#schema, selection, [entity]);
        const created = await this.#mutateFn(operation);

        return created[0];
    }

    async updateOne(entity: EntityBlueprint.Updatable<B>): Promise<EntityBlueprint.Instance<B>> {
        const updatedSelection = intersectSelection(
            entityToSelection(this.#schema, entity),
            getDefaultSelection(this.#schema, isUpdatableEntityProperty),
        );

        if (!updatedSelection) {
            throw new Error(`no updatable properties found`);
        }

        const operation = new MutationOperation("update", this.#schema, updatedSelection, [entity]);
        const updated = await this.#mutateFn(operation);

        return updated[0];
    }

    async deleteOne(entity: EntityBlueprint.Instance<B>): Promise<void> {
        const operation = new MutationOperation("delete", this.#schema, getDefaultSelection(this.#schema), [entity]);
        await this.#mutateFn(operation);
    }
}
