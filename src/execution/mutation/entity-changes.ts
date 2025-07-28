import { Entity, EntitySchema } from "@entity-space/elements";
import { partition } from "lodash";
import { EntityChange } from "./entity-change";
import { EntityMutationType } from "./entity-mutation";

export class EntityChanges {
    constructor(changes: readonly EntityChange[]) {
        this.#changes = Object.freeze(changes.slice());
    }

    readonly #changes: readonly EntityChange[];

    subtractChanges(
        types: readonly EntityMutationType[],
        schema: EntitySchema,
        entities: readonly Entity[],
    ): [changes: EntityChange[], open: EntityChanges | undefined] {
        const [subtracted, open] = partition(
            this.#changes,
            change =>
                types.includes(change.getType()) &&
                change.getSchema().getName() === schema.getName() &&
                entities.includes(change.getEntity()),
        );

        return [subtracted, open.length ? new EntityChanges(open) : undefined];
    }
}
