import { EntitySchema, EntitySelection, intersectSelections, subtractSelection } from "@entity-space/elements";
import { AcceptedEntitySourcing } from "./accepted-entity-sourcing";
import { EntitySourcingState } from "./entity-sourcing-state.interface";

export class DescribedEntitySourcing implements EntitySourcingState {
    constructor(
        schema: EntitySchema,
        targetSelection: EntitySelection,
        acceptedSourcing: AcceptedEntitySourcing[],
        parametersSchema?: EntitySchema,
    ) {
        this.#schema = schema;
        this.#parametersSchema = parametersSchema;
        this.#targetSelection = targetSelection;
        this.#acceptedSourcings = Object.freeze(acceptedSourcing.slice());

        const availableSelection = intersectSelections(
            this.#acceptedSourcings.map(sourcing => sourcing.getReshapedShape().getReshaped().getUnpackedSelection()),
        );

        if (!availableSelection) {
            throw new Error("no intersection between the selections provided by the sourcings");
        }

        this.#availableSelection = availableSelection;
    }

    readonly #schema: EntitySchema;
    readonly #parametersSchema: EntitySchema | undefined;
    readonly #targetSelection: EntitySelection;
    readonly #availableSelection: EntitySelection;
    readonly #acceptedSourcings: readonly AcceptedEntitySourcing[];

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getParametersSchema(): EntitySchema | undefined {
        return this.#parametersSchema;
    }

    getAcceptedSourcings(): readonly AcceptedEntitySourcing[] {
        return this.#acceptedSourcings;
    }

    getTargetSelection(): EntitySelection {
        return this.#targetSelection;
    }

    getAvailableSelection(): EntitySelection {
        return this.#availableSelection;
    }

    getOpenSelection(): EntitySelection | undefined {
        const open = subtractSelection(this.#targetSelection, this.#availableSelection);

        if (open === false) {
            return this.#targetSelection;
        } else if (open === true) {
            return undefined;
        } else {
            return open;
        }
    }
}
