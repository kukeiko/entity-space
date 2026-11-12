import { Entity } from "@entity-space/elements";
import { EntityMutationOptions } from "../../execution-arguments.interface";
import { EntityMutation } from "./entity-mutation";

export interface EntityMutationFailOptions {
    /** Path of the property that caused the failure, e.g. for showing server side validation errors in a form. */
    path?: string;
}

interface EntityMutationFailure {
    error: unknown;
    path?: string;
}

export class EntityMutationContext {
    constructor(
        mutation: EntityMutation,
        options: EntityMutationOptions,
        dispatched: ReadonlySet<Entity> = new Set(),
        signal = new AbortController().signal,
    ) {
        this.#mutation = mutation;
        this.#options = options;
        this.#dispatched = dispatched;
        this.#signal = signal;
    }

    readonly #mutation: EntityMutation;
    readonly #options: EntityMutationOptions;
    readonly #dispatched: ReadonlySet<Entity>;
    readonly #signal: AbortSignal;
    readonly #failed = new Map<Entity, EntityMutationFailure>();
    readonly #succeeded = new Map<Entity, Entity | undefined>();

    /**
     * Aborted when the changeset is cancelled. Pass it on to e.g. fetch() to cancel running requests.
     */
    get signal(): AbortSignal {
        return this.#signal;
    }

    getMutation(): EntityMutation {
        return this.#mutation;
    }

    getOptions(): EntityMutationOptions {
        return this.#options;
    }

    /**
     * Report that the given entity (one that was passed to the mutator, or nested within one) was not persisted.
     */
    fail(entity: object, error: unknown, options?: EntityMutationFailOptions): void {
        this.#assertDispatched(entity as Entity, "fail");
        this.#succeeded.delete(entity as Entity);
        this.#failed.set(entity as Entity, { error, path: options?.path });
    }

    /**
     * Report that the given entity was persisted, optionally with its persisted representation.
     * Only needed if the result can not be matched to the entity by comparing their properties.
     */
    succeed(entity: object, persisted?: object): void {
        this.#assertDispatched(entity as Entity, "succeed");
        this.#failed.delete(entity as Entity);
        this.#succeeded.set(entity as Entity, persisted as Entity | undefined);
    }

    getFailure(entity: Entity): EntityMutationFailure | undefined {
        return this.#failed.get(entity);
    }

    isFailed(entity: Entity): boolean {
        return this.#failed.has(entity);
    }

    isSucceeded(entity: Entity): boolean {
        return this.#succeeded.has(entity);
    }

    getSucceeded(): ReadonlyMap<Entity, Entity | undefined> {
        return this.#succeeded;
    }

    #assertDispatched(entity: Entity, method: string): void {
        if (!this.#dispatched.has(entity)) {
            throw new Error(
                `context.${method}() expects an entity object that was passed to the mutator (or one nested within it)`,
            );
        }
    }
}
