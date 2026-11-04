import {
    Entity,
    EntityBlueprint,
    EntitySchema,
    PackedEntitySelection,
    toRelationSelection,
    unpackSelection,
} from "@entity-space/elements";
import { EntityMutationCacheOptions, EntityMutationOptions } from "./execution-arguments.interface";
import { EntityMutation, EntityMutationType } from "./mutation/entity-mutation";

// [todo] ❌ add method "markWriteRelationIdsOnly(selection)" (or similar) so user can have the option to have relation ids written without mutating the selected relation
// [todo] ❌ S is unused
export class EntityMutationBuilder<B, S extends PackedEntitySelection<EntityBlueprint.Type<B>> = {}> {
    constructor(
        schema: EntitySchema,
        mutateFn: (mutation: EntityMutation, options: EntityMutationOptions) => Promise<Entity[]>,
    ) {
        this.#schema = schema;
        this.#mutateFn = mutateFn;
    }

    readonly #schema: EntitySchema;
    readonly #mutateFn: (mutation: EntityMutation, options: EntityMutationOptions) => Promise<Entity[]>;
    #selection: PackedEntitySelection<EntityBlueprint.Type<B>> = {};
    #cache: EntityMutationCacheOptions | boolean = false;

    select<S extends PackedEntitySelection<EntityBlueprint.Type<B>>>(
        select: S | PackedEntitySelection<EntityBlueprint.Type<B>>,
    ): EntityMutationBuilder<B, S> {
        this.#selection = select;
        return this as any;
    }

    cache(options: EntityMutationCacheOptions | boolean): this {
        this.#cache = options;
        return this;
    }

    async save(entity: EntityBlueprint.Type<B>, previous?: EntityBlueprint.Type<B>): Promise<EntityBlueprint.Type<B>>;
    async save(
        entities: EntityBlueprint.Type<B>[],
        previous?: EntityBlueprint.Type<B>[],
    ): Promise<EntityBlueprint.Type<B>[]>;
    async save(
        entities: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
        previous?: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
    ): Promise<EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>> {
        const mutation = new EntityMutation(
            EntityMutationType.Save,
            this.#schema,
            Array.isArray(entities) ? entities : [entities],
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            previous ? (Array.isArray(previous) ? previous : [previous]) : undefined,
        );

        const saved = await this.#mutateFn(mutation, this.#toMutationArguments());
        return Array.isArray(entities) ? (saved as EntityBlueprint.Type<B>[]) : (saved[0] as EntityBlueprint.Type<B>);
    }

    async delete(entity: EntityBlueprint.Type<B>): Promise<EntityBlueprint.Type<B> | undefined>;
    async delete(entities: EntityBlueprint.Type<B>[]): Promise<EntityBlueprint.Type<B>[]>;
    async delete(
        entities: EntityBlueprint.Type<B> | EntityBlueprint.Type<B>[],
    ): Promise<EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B> | undefined> {
        const previous: EntityBlueprint.Type<B>[] = Array.isArray(entities) ? entities : [entities];
        const mutation = new EntityMutation(
            EntityMutationType.Delete,
            this.#schema,
            [],
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            previous,
        );

        await this.#mutateFn(mutation, this.#toMutationArguments());

        return Array.isArray(entities) ? previous : previous[0];
    }

    #toMutationArguments(): EntityMutationOptions {
        return {
            cache: this.#cache === true ? { key: undefined } : this.#cache,
        };
    }
}
