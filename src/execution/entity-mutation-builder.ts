import {
    Entity,
    EntityBlueprint,
    EntityRelationSelection,
    EntitySchema,
    PackedEntitySelection,
    toRelationSelection,
    unpackSelection,
} from "@entity-space/elements";
import { EntityMutationCacheOptions, EntityMutationOptions } from "./execution-arguments.interface";
import { EntityChangeset, EntityChangesetResultStatus } from "./mutation/entity-changeset";
import { EntityMutationType } from "./mutation/structures/entity-mutation";
import { EntityMutationError } from "./mutation/structures/entity-mutation-error";

export type CreateEntityChangesetFn = (args: {
    type: EntityMutationType;
    schema: EntitySchema;
    selection: EntityRelationSelection;
    next: readonly Entity[];
    previous: readonly Entity[];
    options: EntityMutationOptions;
}) => EntityChangeset;

// [todo] ❌ add method "markWriteRelationIdsOnly(selection)" (or similar) so user can have the option to have relation ids written without mutating the selected relation
// [todo] ❌ S is unused
export class EntityMutationBuilder<B, S extends PackedEntitySelection<EntityBlueprint.Type<B>> = {}> {
    constructor(schema: EntitySchema, createChangeset: CreateEntityChangesetFn) {
        this.#schema = schema;
        this.#createChangeset = createChangeset;
    }

    readonly #schema: EntitySchema;
    readonly #createChangeset: CreateEntityChangesetFn;
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

    /**
     * Plans creating and updating the given entities (and selected related changes) without executing anything yet.
     */
    prepareSave(
        entities: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
        previous?: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
    ): EntityChangeset<EntityBlueprint.Type<B>> {
        return this.#prepare(EntityMutationType.Save, toArray(entities), previous ? toArray(previous) : []);
    }

    /**
     * Like prepareSave(), but also plans deleting previous root entities that are missing from the given entities.
     */
    prepareSync(
        entities: EntityBlueprint.Type<B>[],
        previous: EntityBlueprint.Type<B>[],
    ): EntityChangeset<EntityBlueprint.Type<B>> {
        return this.#prepare(EntityMutationType.Sync, entities, previous);
    }

    /**
     * Plans deleting the given entities (and selected related inbound entities) without executing anything yet.
     */
    prepareDelete(
        entities: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
    ): EntityChangeset<EntityBlueprint.Type<B>> {
        return this.#prepare(EntityMutationType.Delete, [], toArray(entities));
    }

    /**
     * Shortcut for prepareSave() + execute(). Returns copies of the resulting next and previous entities.
     * Throws an EntityMutationError carrying the changeset if not all changes succeeded.
     */
    async save(
        entity: EntityBlueprint.Type<B>,
        previous?: EntityBlueprint.Type<B>,
    ): Promise<[EntityBlueprint.Type<B>, EntityBlueprint.Type<B>]>;
    async save(
        entities: EntityBlueprint.Type<B>[],
        previous?: EntityBlueprint.Type<B>[],
    ): Promise<[EntityBlueprint.Type<B>[], EntityBlueprint.Type<B>[]]>;
    async save(
        entities: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
        previous?: EntityBlueprint.Type<B>[] | EntityBlueprint.Type<B>,
    ): Promise<
        [EntityBlueprint.Type<B>, EntityBlueprint.Type<B>] | [EntityBlueprint.Type<B>[], EntityBlueprint.Type<B>[]]
    > {
        const [next, persisted] = await this.#execute(this.prepareSave(entities, previous));

        if (Array.isArray(entities)) {
            return [next, persisted];
        } else {
            return [next[0], persisted[0]];
        }
    }

    /**
     * Shortcut for prepareSync() + execute(). Returns copies of the resulting next and previous entities.
     * Throws an EntityMutationError carrying the changeset if not all changes succeeded.
     */
    async sync(
        entities: EntityBlueprint.Type<B>[],
        previous: EntityBlueprint.Type<B>[],
    ): Promise<[EntityBlueprint.Type<B>[], EntityBlueprint.Type<B>[]]> {
        return this.#execute(this.prepareSync(entities, previous));
    }

    /**
     * Shortcut for prepareDelete() + execute(). Returns copies of the resulting next and previous entities.
     * Throws an EntityMutationError carrying the changeset if not all changes succeeded.
     */
    async delete(
        entity: EntityBlueprint.Type<B>,
    ): Promise<[EntityBlueprint.Type<B> | undefined, EntityBlueprint.Type<B> | undefined]>;
    async delete(entities: EntityBlueprint.Type<B>[]): Promise<[EntityBlueprint.Type<B>[], EntityBlueprint.Type<B>[]]>;
    async delete(
        entities: EntityBlueprint.Type<B> | EntityBlueprint.Type<B>[],
    ): Promise<
        | [EntityBlueprint.Type<B> | undefined, EntityBlueprint.Type<B> | undefined]
        | [EntityBlueprint.Type<B>[], EntityBlueprint.Type<B>[]]
    > {
        const [next, previous] = await this.#execute(this.prepareDelete(entities));

        if (Array.isArray(entities)) {
            return [next, previous];
        } else {
            return [next[0], previous[0]];
        }
    }

    async #execute(
        changeset: EntityChangeset<EntityBlueprint.Type<B>>,
    ): Promise<[EntityBlueprint.Type<B>[], EntityBlueprint.Type<B>[]]> {
        const summary = await changeset.execute();

        if (summary.status !== EntityChangesetResultStatus.Succeeded) {
            throw new EntityMutationError(changeset as EntityChangeset, summary);
        }

        return [changeset.getNext(), changeset.getPrevious()];
    }

    #prepare(
        type: EntityMutationType,
        next: EntityBlueprint.Type<B>[],
        previous: EntityBlueprint.Type<B>[],
    ): EntityChangeset<EntityBlueprint.Type<B>> {
        return this.#createChangeset({
            type,
            schema: this.#schema,
            selection: toRelationSelection(this.#schema, unpackSelection(this.#schema, this.#selection)),
            next,
            previous,
            options: this.#toMutationOptions(),
        }) as EntityChangeset<EntityBlueprint.Type<B>>;
    }

    #toMutationOptions(): EntityMutationOptions {
        return {
            cache: this.#cache === true ? { key: undefined } : this.#cache,
        };
    }
}

function toArray<T>(value: T | T[]): T[] {
    return Array.isArray(value) ? value : [value];
}
