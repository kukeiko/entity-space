import {
    EntityBlueprint,
    EntitySchema,
    isRequiredCreatableEntityProperty,
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

    // [todo] inconsistency w/ query/hydration builder: they have "getOne()", "hydrateOne()" - so this should be "createOne()" instead
    async create(entity: EntityBlueprint.Creatable<B>): Promise<EntityBlueprint.Instance<B>> {
        const selection = unpackSelection(this.#schema, this.#selection, isRequiredCreatableEntityProperty);
        const operation = new MutationOperation("create", this.#schema, selection, [entity]);
        const created = await this.#mutateFn(operation);

        return created[0];
    }

    createMany(entities: EntityBlueprint.Creatable<B>[]): Promise<EntityBlueprint.Instance<B>[]> {
        const selection = unpackSelection(this.#schema, this.#selection, isRequiredCreatableEntityProperty);
        const operation = new MutationOperation("create", this.#schema, selection, entities);

        return this.#mutateFn(operation);
    }

    update(entities: EntityBlueprint.Updatable<B>[]): Promise<EntityBlueprint.Instance<B>[]> {
        throw new Error("not yet implemented");
    }

    save(entities: EntityBlueprint.Instance<B>[]): Promise<EntityBlueprint.Instance<B>[]> {
        throw new Error("not yet implemented");
    }

    delete(entities: EntityBlueprint.Instance<B>[]): Promise<EntityBlueprint.Instance<B>[]> {
        throw new Error("not yet implemented");
    }
}
