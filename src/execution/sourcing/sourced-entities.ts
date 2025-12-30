import { EntitySchema, EntitySelection } from "@entity-space/elements";
import { EntitySourcingState } from "./entity-sourcing-state.interface";

export class SourcedEntities implements EntitySourcingState {
    constructor(
        schema: EntitySchema,
        targetSelection: EntitySelection,
        availableSelection: EntitySelection,
        openSelection?: EntitySelection,
    ) {
        this.#schema = schema;
        this.#targetSelection = targetSelection;
        this.#availableSelection = availableSelection;
        this.#openSelection = openSelection;
    }

    readonly #schema: EntitySchema;
    readonly #targetSelection: EntitySelection;
    readonly #availableSelection: EntitySelection;
    readonly #openSelection: EntitySelection | undefined;

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getParametersSchema(): EntitySchema | undefined {
        return undefined
    }

    getTargetSelection(): EntitySelection {
        return this.#targetSelection;
    }

    getAvailableSelection(): EntitySelection {
        return this.#availableSelection;
    }

    getOpenSelection(): EntitySelection | undefined {
        return this.#openSelection;
    }
}
