import { Entity } from "@entity-space/elements";
import { EntityMutationOptions } from "../../execution-arguments.interface";
import { EntityMutation } from "./entity-mutation";
import { EntityMutationOutcomes } from "./entity-mutation-outcomes";

export interface EntityMutationFailOptions {
    /** Path of the property that caused the failure, e.g. for showing server side validation errors in a form. */
    path?: string;
}

export class EntityMutationContext {
    constructor(
        mutation: EntityMutation,
        options: EntityMutationOptions,
        outcomes = new EntityMutationOutcomes(),
        signal = new AbortController().signal,
    ) {
        this.#mutation = mutation;
        this.#options = options;
        this.#outcomes = outcomes;
        this.#signal = signal;
    }

    readonly #mutation: EntityMutation;
    readonly #options: EntityMutationOptions;
    readonly #outcomes: EntityMutationOutcomes;
    readonly #signal: AbortSignal;

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
        this.#outcomes.fail(entity as Entity, error, options?.path);
    }

    /**
     * Report that the given entity was persisted, optionally with its persisted representation.
     * Only needed if the result can not be matched to the entity by comparing their properties.
     */
    succeed(entity: object, persisted?: object): void {
        this.#outcomes.succeed(entity as Entity, persisted as Entity | undefined);
    }

    getOutcomes(): EntityMutationOutcomes {
        return this.#outcomes;
    }
}
