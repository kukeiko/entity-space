import { Entity, EntitySchema, EntitySelection } from "@entity-space/elements";
import { EntityMutationFunction } from "./entity-mutator";
import { MutationOperationType } from "./mutation-operation";

export class AcceptedEntityMutation {
    constructor(
        schema: EntitySchema,
        type: MutationOperationType,
        selection: EntitySelection,
        mutateFn: EntityMutationFunction,
    ) {
        this.#schema = schema;
        this.#type = type;
        this.#selection = selection;
        this.#mutateFn = mutateFn;
    }

    readonly #schema: EntitySchema;
    readonly #type: MutationOperationType;
    readonly #selection: EntitySelection;
    readonly #mutateFn: EntityMutationFunction;

    getSelection(): EntitySelection {
        return this.#selection;
    }

    mutate(entities: Entity[]): Promise<Entity[]> {
        return this.#mutateFn(entities, this.#selection);
    }
}
