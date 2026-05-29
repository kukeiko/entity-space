import {
    Entity,
    EntityBlueprint,
    EntitySchema,
    PackedEntitySelection,
    toRelationSelection,
    unpackSelection,
} from "@entity-space/elements";
import { EntityMutation } from "./mutation/entity-mutation";

// [todo] ❌ add method "markWriteRelationIdsOnly(selection)" (or similar) so user can have the option to have relation ids written without mutating the selected relation
// [todo] ❌ S is unused
export class EntityMutationBuilder<B, S extends PackedEntitySelection<EntityBlueprint.Type<B>> = {}> {
    constructor(schema: EntitySchema, mutateFn: (mutation: EntityMutation) => Promise<Entity[]>) {
        this.#schema = schema;
        this.#mutateFn = mutateFn;
    }

    readonly #schema: EntitySchema;
    readonly #mutateFn: (mutation: EntityMutation) => Promise<Entity[]>;
    #selection: PackedEntitySelection<EntityBlueprint.Type<B>> = {};

    select<S extends PackedEntitySelection<EntityBlueprint.Type<B>>>(
        select: S | PackedEntitySelection<EntityBlueprint.Type<B>>,
    ): EntityMutationBuilder<B, S> {
        this.#selection = select;
        return this as any;
    }

    /**
     * @deprecated use {@link save} instead
     */
    async saveOne(entity: EntityBlueprint.Type<B>): Promise<EntityBlueprint.Type<B>> {
        const mutation = new EntityMutation(
            "save",
            this.#schema,
            [entity],
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
        );

        const saved = await this.#mutateFn(mutation);
        return saved[0] as EntityBlueprint.Type<B>;
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
            "save",
            this.#schema,
            Array.isArray(entities) ? entities : [entities],
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            previous ? (Array.isArray(previous) ? previous : [previous]) : undefined,
        );

        const saved = await this.#mutateFn(mutation);
        return Array.isArray(entities) ? (saved as EntityBlueprint.Type<B>[]) : (saved[0] as EntityBlueprint.Type<B>);
    }

    async create(entity: EntityBlueprint.Type<B>, previous?: EntityBlueprint.Type<B>): Promise<EntityBlueprint.Type<B>>;
    async create(
        entities: EntityBlueprint.Type<B>[],
        previous?: EntityBlueprint.Type<B>[],
    ): Promise<EntityBlueprint.Type<B>[]>;
    async create(
        entities: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
        previous?: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
    ): Promise<EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>> {
        const mutation = new EntityMutation(
            "create",
            this.#schema,
            Array.isArray(entities) ? entities : [entities],
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            previous ? (Array.isArray(previous) ? previous : [previous]) : undefined,
        );

        const saved = await this.#mutateFn(mutation);
        return Array.isArray(entities) ? (saved as EntityBlueprint.Type<B>[]) : (saved[0] as EntityBlueprint.Type<B>);
    }

    async update(entity: EntityBlueprint.Type<B>, previous?: EntityBlueprint.Type<B>): Promise<EntityBlueprint.Type<B>>;
    async update(
        entities: EntityBlueprint.Type<B>[],
        previous?: EntityBlueprint.Type<B>[],
    ): Promise<EntityBlueprint.Type<B>[]>;
    async update(
        entities: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
        previous?: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
    ): Promise<EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>> {
        const mutation = new EntityMutation(
            "update",
            this.#schema,
            Array.isArray(entities) ? entities : [entities],
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            previous ? (Array.isArray(previous) ? previous : [previous]) : undefined,
        );

        const saved = await this.#mutateFn(mutation);
        return Array.isArray(entities) ? (saved as EntityBlueprint.Type<B>[]) : (saved[0] as EntityBlueprint.Type<B>);
    }

    async delete(entity: EntityBlueprint.Type<B>): Promise<EntityBlueprint.Type<B> | undefined>;
    async delete(entities: EntityBlueprint.Type<B>[]): Promise<EntityBlueprint.Type<B>[]>;
    async delete(
        entities: EntityBlueprint.Type<B> | EntityBlueprint.Type<B>[],
    ): Promise<EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B> | undefined> {
        const previous: EntityBlueprint.Type<B>[] = Array.isArray(entities) ? entities : [entities];
        const mutation = new EntityMutation(
            "delete",
            this.#schema,
            [],
            toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            previous,
        );

        await this.#mutateFn(mutation);

        return Array.isArray(entities) ? previous : previous[0];
    }
}
