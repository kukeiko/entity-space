import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";

export type EntityMutationType = "create" | "update" | "save" | "delete";

export class EntityMutation {
    constructor(
        type: EntityMutationType,
        schema: EntitySchema,
        entities: Entity[],
        selection?: EntityRelationSelection,
        previous?: Entity[],
    ) {
        this.#type = type;
        this.#schema = schema;
        this.#entities = entities;
        this.#selection = selection;
        this.#previous = previous;
    }

    readonly #type: EntityMutationType;
    readonly #schema: EntitySchema;
    readonly #entities: Entity[];
    readonly #selection?: EntityRelationSelection;
    readonly #previous?: Entity[];

    getType(): EntityMutationType {
        return this.#type;
    }

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getSelection(): EntityRelationSelection | undefined {
        return this.#selection;
    }

    getEntities(): Entity[] {
        return this.#entities;
    }

    getPrevious(): Entity[] | undefined {
        return this.#previous;
    }
}
