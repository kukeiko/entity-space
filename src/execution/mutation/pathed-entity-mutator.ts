import { Path } from "@entity-space/utils";
import { EntityMutator } from "./entity-mutator";
import { AcceptedEntityMutation } from "./structures/accepted-entity-mutation";
import { EntityChanges } from "./structures/entity-changes";

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
}
