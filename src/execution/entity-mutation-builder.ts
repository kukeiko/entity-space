import {
    Entity,
    EntityBlueprint,
    EntitySchema,
    PackedEntitySelection,
    toRelationSelection,
    unpackSelection,
} from "@entity-space/elements";
import { EntityMutation } from "./mutation/entity-mutation";

export class EntityMutationBuilder<B, S extends PackedEntitySelection<EntityBlueprint.Instance<B>> = {}> {
    constructor(schema: EntitySchema, mutateFn: (mutation: EntityMutation) => Promise<Entity[]>) {
        this.#schema = schema;
        this.#mutateFn = mutateFn;
    }

    readonly #schema: EntitySchema;
    readonly #mutateFn: (mutation: EntityMutation) => Promise<Entity[]>;
    #selection: PackedEntitySelection<EntityBlueprint.Instance<B>> = {};

    select<S extends PackedEntitySelection<EntityBlueprint.Instance<B>>>(
        select: S | PackedEntitySelection<EntityBlueprint.Instance<B>>,
    ): EntityMutationBuilder<B, S> {
        this.#selection = select;
        return this as any;
    }

    saveOne(entity: EntityBlueprint.Savable<B>): Promise<EntityBlueprint.Instance<B>> {
        throw new Error("not yet implemented");
    }

    async save(
        entities: EntityBlueprint.Savable<B>[],
        previous?: EntityBlueprint.Instance<B>[],
    ): Promise<EntityBlueprint.Instance<B>[]> {
        const mutation = new EntityMutation(
            "save",
            this.#schema,
            entities,
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            previous,
        );

        const saved = await this.#mutateFn(mutation);
        return saved as EntityBlueprint.Instance<B>[];
    }

    async createOne(entity: EntityBlueprint.Creatable<B>): Promise<EntityBlueprint.Instance<B>> {
        throw new Error("not yet implemented");
        // const selection = unpackSelection(this.#schema, this.#selection, isRequiredCreatableEntityProperty);
        // const operation = new EntityMutation("create", this.#schema, selection, [entity]);
        // const created = await this.#mutateFn(operation);

        // return created[0];
    }

    create(entities: EntityBlueprint.Creatable<B>[]): Promise<EntityBlueprint.Instance<B>[]> {
        throw new Error("not yet implemented");
        // const selection = unpackSelection(this.#schema, this.#selection, isRequiredCreatableEntityProperty);
        // const operation = new EntityMutation("create", this.#schema, selection, entities);

        // return this.#mutateFn(operation);
    }

    async updateOne(entity: EntityBlueprint.Updatable<B>): Promise<EntityBlueprint.Instance<B>> {
        throw new Error("not yet implemented");
        // const updatedSelection = intersectSelection(
        //     entityToSelection(this.#schema, entity),
        //     getDefaultSelection(this.#schema, isUpdatableEntityProperty),
        // );

        // if (!updatedSelection) {
        //     throw new Error(`no updatable properties found`);
        // }

        // const operation = new EntityMutation("update", this.#schema, updatedSelection, [entity]);
        // const updated = await this.#mutateFn(operation);

        // return updated[0];
    }

    update(entities: EntityBlueprint.Updatable<B>[]): Promise<EntityBlueprint.Instance<B>[]> {
        throw new Error("not yet implemented");
    }

    async deleteOne(entity: EntityBlueprint.Instance<B>): Promise<void> {
        throw new Error("not yet implemented");
        // const operation = new EntityMutation("delete", this.#schema, getDefaultSelection(this.#schema), [entity]);
        // await this.#mutateFn(operation);
    }

    async delete(entities: EntityBlueprint.Instance<B>[]): Promise<void> {
        const mutation = new EntityMutation(
            "delete",
            this.#schema,
            [],
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            entities,
        );

        await this.#mutateFn(mutation);
    }
}
