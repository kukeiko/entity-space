import { Path } from "@entity-space/utils";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { EntityChanges } from "./entity-changes";
import { EntityMutator } from "./entity-mutator";

export class PathedEntityMutator extends EntityMutator {
    constructor(path: Path, mutator: EntityMutator) {
        super();
        this.#path = path;
        this.#mutator = mutator;
    }

    readonly #path: Path;
    readonly #mutator: EntityMutator;

    override accept(
        changes: EntityChanges,
    ): [accepted: AcceptedEntityMutation | undefined, open: EntityChanges | undefined] {
        return this.#mutator.accept(changes, this.#path);
    }

    override async mutate(mutation: AcceptedEntityMutation): Promise<void> {
        await this.#mutator.mutate(mutation);
    }
}
