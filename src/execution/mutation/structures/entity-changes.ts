import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { Path, readPath } from "@entity-space/utils";
import { EntityChange } from "./entity-change";

export class EntityChanges {
    constructor(
        schema: EntitySchema,
        selection: EntityRelationSelection,
        changes: readonly EntityChange[],
        entities: readonly Entity[],
        previous: readonly Entity[],
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
    readonly #previous: readonly Entity[];

    getSchema(path?: Path): EntitySchema {
        return path ? this.#schema.getRelation(path).getRelatedSchema() : this.#schema;
    }

    getSelection(path?: Path): EntityRelationSelection {
        return readPath(path, this.#selection) ?? {};
    }

    getEntities(path?: Path): readonly Entity[] {
        return readPath(path, this.#entities);
    }

    getPrevious(path?: Path): Entity[] {
        return readPath(path, this.#previous);
    }

    getChanges(): readonly EntityChange[] {
        return this.#changes;
    }

    with(patch: { changes?: EntityChange[] | null }): EntityChanges {
        return new EntityChanges(
            this.#schema,
            this.#selection,
            patch.changes === null ? [] : (patch.changes ?? this.#changes),
            this.#entities,
            this.#previous,
        );
    }
}
