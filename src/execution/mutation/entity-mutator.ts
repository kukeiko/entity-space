import { Entity, EntitySchema, EntitySelection, intersectSelection, isSelectionSubsetOf } from "@entity-space/elements";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { MutationOperationType } from "./mutation-operation";

export type EntityMutationFunction = (entities: readonly Entity[], selection: EntitySelection) => Promise<Entity[]>;

export class EntityMutator {
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

    accept(
        schema: EntitySchema,
        type: MutationOperationType,
        selection: EntitySelection,
    ): AcceptedEntityMutation | false {
        if (schema.getName() !== this.#schema.getName()) {
            return false;
        } else if (type !== this.#type) {
            return false;
        } else if (!isSelectionSubsetOf(selection, this.#selection)) {
            return false;
        }

        const intersectedSelection = intersectSelection(selection, this.#selection);

        if (intersectedSelection === false) {
            throw new Error("bad selection logic");
        }

        return new AcceptedEntityMutation(schema, type, intersectedSelection, this.#mutateFn);
    }
}
