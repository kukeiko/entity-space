import { Entity, EntitySchema } from "@entity-space/elements";
import { EntityMutationType } from "./entity-mutation";

export class EntityChange {
    constructor(
        type: EntityMutationType,
        schema: EntitySchema,
        entity: Entity,
        patch?: Entity,
        removeFn?: (entity: Entity) => void,
    ) {
        this.#type = type;
        this.#schema = schema;
        this.#entity = entity;
        this.#patch = patch;
        this.#removeFn = removeFn;
    }

    readonly #type: EntityMutationType;
    readonly #schema: EntitySchema;
    readonly #entity: Entity;
    readonly #patch?: Entity;
    readonly #removeFn?: (entity: Entity) => void;

    getType(): EntityMutationType {
        return this.#type;
    }

    isCreate(): boolean {
        return this.getType() === "create";
    }

    isUpdate(): boolean {
        return this.getType() === "update";
    }

    isCreateOrUpdate(): boolean {
        return this.isCreate() || this.isUpdate();
    }

    isDelete(): boolean {
        return this.getType() === "delete";
    }

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getEntity(): Entity {
        return this.#entity;
    }

    getEntityPatch(): Entity | undefined {
        return this.#patch;
    }

    removeEntity(): void {
        this.#removeFn?.(this.#entity);
    }
}
