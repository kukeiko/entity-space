import { Entity } from "@entity-space/elements";

export interface EntityMutationFailure {
    error: unknown;
    path?: string;
}

/**
 * Collects the outcomes a mutator reports for the entities it received, keyed by the identity of those entities.
 */
export class EntityMutationOutcomes {
    constructor(dispatched: ReadonlySet<Entity> = new Set()) {
        this.#dispatched = dispatched;
    }

    readonly #dispatched: ReadonlySet<Entity>;
    readonly #failed = new Map<Entity, EntityMutationFailure>();
    readonly #succeeded = new Map<Entity, Entity | undefined>();

    fail(entity: Entity, error: unknown, path?: string): void {
        this.#assertDispatched(entity, "fail");
        this.#succeeded.delete(entity);
        this.#failed.set(entity, { error, path });
    }

    succeed(entity: Entity, persisted?: Entity): void {
        this.#assertDispatched(entity, "succeed");
        this.#failed.delete(entity);
        this.#succeeded.set(entity, persisted);
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
