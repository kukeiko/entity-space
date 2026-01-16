import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { Path, readPath } from "@entity-space/utils";
import { partition } from "lodash";
import { EntityChange } from "./entity-change";
import { EntityMutationType } from "./entity-mutation";

export class EntityChanges {
    constructor(
        schema: EntitySchema,
        selection: EntityRelationSelection,
        changes: readonly EntityChange[],
        entities: readonly Entity[],
        previous?: readonly Entity[],
    ) {
        this.#schema = schema;
        this.#changes = Object.freeze(changes.slice());
        this.#selection = selection;
        this.#entities = Object.freeze(entities.slice());
        this.#previous = previous;
    }

    readonly #schema: EntitySchema;
    readonly #selection: EntityRelationSelection;
    readonly #changes: readonly EntityChange[];
    readonly #entities: readonly Entity[];
    readonly #previous?: readonly Entity[];

    getSchema(path?: Path): EntitySchema {
        return path ? this.#schema.getRelation(path).getRelatedSchema() : this.#schema;
    }

    getSelection(path?: Path): EntityRelationSelection {
        return readPath(path, this.#selection) ?? {};
    }

    getEntities(path?: Path): readonly Entity[] {
        return readPath(path, this.#entities);
    }

    getPrevious(path?: Path): Entity[] | undefined {
        if (!this.#previous) {
            return undefined;
        }

        return readPath(path, this.#previous);
    }

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

        return [
            subtracted,
            open.length
                ? new EntityChanges(this.#schema, this.#selection, open, this.#entities, this.#previous)
                : undefined,
        ];
    }
}
