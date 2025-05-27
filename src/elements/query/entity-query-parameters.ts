import { Entity } from "../entity/entity";
import { EntitySchema } from "../entity/entity-schema";

export class EntityQueryParameters {
    constructor(schema: EntitySchema, parameters: Entity) {
        this.#schema = schema;
        this.#value = parameters;
    }

    readonly #schema: EntitySchema;
    readonly #value: Entity;

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getValue(): Entity {
        return this.#value;
    }
}
