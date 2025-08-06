import { Entity, EntitySelection, selectionToString } from "@entity-space/elements";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";

export type HydrateEntitiesFunction = (
    entities: Entity[],
    selection: EntitySelection,
    context: EntityQueryExecutionContext,
) => Promise<void>;

export class AcceptedEntityHydration {
    constructor(
        acceptedSelection: EntitySelection,
        requiredSelection: EntitySelection,
        hydrateFn: HydrateEntitiesFunction,
    ) {
        this.#acceptedSelection = acceptedSelection;
        this.#requiredSelection = requiredSelection;
        this.#hydrateFn = hydrateFn;
    }

    readonly #acceptedSelection: EntitySelection;
    readonly #requiredSelection: EntitySelection;
    readonly #hydrateFn: HydrateEntitiesFunction;

    getAcceptedSelection(): EntitySelection {
        return this.#acceptedSelection;
    }

    getRequiredSelection(): EntitySelection {
        return this.#requiredSelection;
    }

    hydrateEntities(entities: Entity[], context: EntityQueryExecutionContext): Promise<void> {
        return this.#hydrateFn(entities, this.#acceptedSelection, context);
    }

    toString() : string {
        // to make debugging easier. should not be relied upon as actual logic
        return selectionToString(this.#acceptedSelection);
    }
}
