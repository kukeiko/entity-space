import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";

export const EntityMutationType = {
    Save: "save",
    Sync: "sync",
    Delete: "delete",
} as const;

export type EntityMutationType = (typeof EntityMutationType)[keyof typeof EntityMutationType];

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

    isSave(): boolean {
        return this.#type === EntityMutationType.Save;
    }

    isSync(): boolean {
        return this.#type === EntityMutationType.Sync;
    }

    isDelete(): boolean {
        return this.#type === EntityMutationType.Delete;
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

    getPrevious(): Entity[] {
        return this.#previous ?? [];
    }
}
