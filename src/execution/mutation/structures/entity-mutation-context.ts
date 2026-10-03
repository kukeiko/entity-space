import { EntityMutationOptions } from "../../execution-arguments.interface";
import { EntityMutation } from "../entity-mutation";

export class EntityMutationContext {
    constructor(mutation: EntityMutation, options: EntityMutationOptions) {
        this.#mutation = mutation;
        this.#options = options;
    }

    readonly #mutation: EntityMutation;
    readonly #options: EntityMutationOptions;

    getMutation(): EntityMutation {
        return this.#mutation;
    }

    getOptions(): EntityMutationOptions {
        return this.#options;
    }
}
