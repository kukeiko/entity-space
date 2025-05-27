import { Entity } from "@entity-space/elements";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";

export class DescribedEntityMutation {
    constructor(
        acceptedMutations: AcceptedEntityMutation[],
        readonly entities: readonly Entity[],
    ) {
        this.#acceptedMutations = Object.freeze(acceptedMutations.slice());
        this.#entities = Object.freeze(entities.slice());
    }

    readonly #acceptedMutations: readonly AcceptedEntityMutation[];
    readonly #entities: readonly Entity[];

    getAcceptedMutations(): readonly AcceptedEntityMutation[] {
        return this.#acceptedMutations;
    }

    getEntities(): readonly Entity[] {
        return this.#entities;
    }
}
