import { Entity, EntitySchema, EntitySelection } from "@entity-space/elements";

export type MutationOperationType = "create" | "update" | "delete";

export class MutationOperation {
    constructor(
        type: MutationOperationType,
        schema: EntitySchema,
        selection: EntitySelection,
        entities: readonly Entity[],
    ) {
        this.#type = type;
        this.#schema = schema;
        this.#selection = selection;
        this.#entities = Object.freeze(entities.slice());
    }

    readonly #type: MutationOperationType;
    readonly #schema: EntitySchema;
    readonly #selection: EntitySelection;
    readonly #entities: readonly Entity[];

    getType(): MutationOperationType {
        return this.#type;
    }

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getSelection(): EntitySelection {
        return this.#selection;
    }

    getEntities(): readonly Entity[] {
        return this.#entities;
    }

    toString(): string {
        // [todo] implement
        return "implement-me!";
    }
}
