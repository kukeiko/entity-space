import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { Path, readPath } from "@entity-space/utils";
import { isEmpty } from "lodash";
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
        schema: EntitySchema,
        entities: readonly Entity[],
        changes: EntityChanges,
        selection?: EntityRelationSelection,
        previous?: readonly Entity[],
    ): [accepted: AcceptedEntityMutation | undefined, open: EntityChanges | undefined] {
        schema = schema.getRelation(this.#path).getRelatedSchema();
        selection = selection ? readPath(this.#path, selection) : undefined;
        entities = readPath(this.#path, entities);
        previous = previous ? readPath(this.#path, previous) : undefined;

        return this.#mutator.accept(schema, entities, changes, isEmpty(selection) ? undefined : selection, previous);
    }

    override async mutate(mutation: AcceptedEntityMutation): Promise<void> {
        await this.#mutator.mutate(mutation);
    }
}
