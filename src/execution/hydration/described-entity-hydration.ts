import { EntitySelection, mergeSelections } from "@entity-space/elements";
import { AcceptedEntityHydration } from "./accepted-entity-hydration";

export class DescribedEntityHydration {
    constructor(acceptedHydrations: AcceptedEntityHydration[][]) {
        this.#acceptedHydrations = Object.freeze(
            acceptedHydrations.slice().map(acceptedHydration => Object.freeze(acceptedHydration.slice())),
        );
    }

    readonly #acceptedHydrations: readonly (readonly AcceptedEntityHydration[])[];

    getAcceptedHydrations(): readonly (readonly AcceptedEntityHydration[])[] {
        return this.#acceptedHydrations;
    }

    getAcceptedSelection(): EntitySelection {
        return mergeSelections(
            this.#acceptedHydrations.flatMap(acceptedHydrations =>
                acceptedHydrations.map(acceptedHydration => acceptedHydration.getAcceptedSelection()),
            ),
        );
    }
}
