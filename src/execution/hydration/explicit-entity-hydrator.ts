import {
    cloneSelection,
    EntitySchema,
    EntitySelection,
    intersectSelection,
    isSelectionSubsetOf,
    selectionToString,
    subtractSelection,
} from "@entity-space/elements";
import { AcceptedEntityHydration, HydrateEntitiesFunction } from "./accepted-entity-hydration";
import { EntityHydrator } from "./entity-hydrator";

export class ExplicitEntityHydrator extends EntityHydrator {
    constructor(
        schema: EntitySchema,
        requiredSelection: EntitySelection,
        hydratedSelection: EntitySelection,
        hydrateFn: HydrateEntitiesFunction,
    ) {
        super();
        this.#schema = schema;
        this.#requiredSelection = requiredSelection;
        this.#hydratedSelection = hydratedSelection;
        this.#hydrateFn = hydrateFn;
    }

    readonly #schema: EntitySchema;
    readonly #requiredSelection: EntitySelection;
    readonly #hydratedSelection: EntitySelection;
    readonly #hydrateFn: HydrateEntitiesFunction;

    override expand(schema: EntitySchema, openSelection: EntitySelection): false | EntitySelection {
        if (this.#schema.getName() !== schema.getName()) {
            return false;
        } else if (!intersectSelection(this.#hydratedSelection, openSelection)) {
            return false;
        } else if (subtractSelection(this.#requiredSelection, openSelection) === true) {
            return false;
        }

        return cloneSelection(this.#requiredSelection);
    }

    override accept(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): AcceptedEntityHydration | false {
        if (this.#schema.getName() !== schema.getName()) {
            return false;
        }

        if (!isSelectionSubsetOf(this.#requiredSelection, availableSelection)) {
            return false;
        }

        const acceptedSelection = intersectSelection(this.#hydratedSelection, openSelection);

        if (acceptedSelection === false) {
            return false;
        }

        return new AcceptedEntityHydration(
            acceptedSelection,
            this.#requiredSelection,
            async (entities, selection, context) => {
                await this.#hydrateFn(entities, selection, context);
            },
        );
    }

    override toString(): string {
        // to make prettier tracing messages. should not be relied upon as actual logic
        return selectionToString(this.#hydratedSelection);
    }
}
